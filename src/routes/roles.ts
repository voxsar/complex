import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Role } from "../entities/Role";
import { User } from "../entities/User";
import { Permission } from "../enums/permission";
import { authenticate, authorize, AuthRequest } from "../middleware/rbac";
import { validate } from "class-validator";

const router = Router();

// Get all roles
router.get("/", authenticate, authorize([Permission.ADMIN_ROLES]), async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      isActive,
      search,
      sortBy = "priority",
      sortOrder = "desc",
    } = req.query;

    const roleRepository = AppDataSource.getRepository(Role);
    
    // Build query
    const query: any = {};
    
    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Sort configuration
    const sortConfig: any = {};
    sortConfig[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    const [roles, total] = await Promise.all([
      roleRepository.find({
        where: query,
        skip,
        take: limitNum,
        order: sortConfig,
      }),
      roleRepository.count({ where: query }),
    ]);

    // Get user count for each role
    const userRepository = AppDataSource.getRepository(User);
    const enrichedRoles = await Promise.all(
      roles.map(async (role) => {
        const userCount = await userRepository.count({
          where: {
            roleIds: { $in: [role.id] } as any,
          },
        });

        return {
          ...role,
          userCount,
        };
      })
    );

    res.json({
      roles: enrichedRoles,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error("Error fetching roles:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get role by ID
router.get("/:id", authenticate, authorize([Permission.ADMIN_ROLES]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const roleRepository = AppDataSource.getRepository(Role);
    
    const role = await roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Get users with this role
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      where: {
        roleIds: { $in: [role.id] } as any,
      },
      select: ["id", "email", "firstName", "lastName", "role", "isActive"],
    });

    res.json({
      ...role,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        isActive: user.isActive,
      })),
      userCount: users.length,
    });
  } catch (error) {
    logger.error("Error fetching role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create new role
router.post("/", authenticate, authorize([Permission.ADMIN_ROLES]), async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      permissions = [],
      isActive = true,
      priority = 1,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Role name is required"
      });
    }

    const roleRepository = AppDataSource.getRepository(Role);

    // Check if role name already exists
    const existingRole = await roleRepository.findOne({
      where: { name },
    });

    if (existingRole) {
      return res.status(409).json({
        error: "Role with this name already exists"
      });
    }

    // Validate permissions
    const validPermissions = Object.values(Permission);
    const invalidPermissions = permissions.filter((p: Permission) => !validPermissions.includes(p));
    
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        error: "Invalid permissions",
        invalidPermissions,
        validPermissions,
      });
    }

    // Create role
    const role = roleRepository.create({
      name,
      description,
      permissions,
      isActive,
      priority,
    });

    // Validate the entity
    const errors = await validate(role);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const savedRole = await roleRepository.save(role);

    res.status(201).json({
      message: "Role created successfully",
      role: savedRole,
    });
  } catch (error) {
    logger.error("Error creating role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update role
router.put("/:id", authenticate, authorize([Permission.ADMIN_ROLES]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      permissions,
      isActive,
      priority,
    } = req.body;

    const roleRepository = AppDataSource.getRepository(Role);
    
    const role = await roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Check if role is a system role
    if (role.isSystemRole) {
      return res.status(403).json({
        error: "Cannot modify system role"
      });
    }

    // Check if new name conflicts with existing role
    if (name && name !== role.name) {
      const existingRole = await roleRepository.findOne({
        where: { name },
      });

      if (existingRole) {
        return res.status(409).json({
          error: "Role with this name already exists"
        });
      }
    }

    // Validate permissions if provided
    if (permissions) {
      const validPermissions = Object.values(Permission);
      const invalidPermissions = permissions.filter((p: Permission) => !validPermissions.includes(p));
      
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          error: "Invalid permissions",
          invalidPermissions,
          validPermissions,
        });
      }
    }

    // Update fields
    if (name !== undefined) role.name = name;
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;
    if (isActive !== undefined) role.isActive = isActive;
    if (priority !== undefined) role.priority = priority;

    role.updatedAt = new Date();

    // Validate the updated entity
    const errors = await validate(role);
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors.map(err => ({
          property: err.property,
          constraints: err.constraints
        }))
      });
    }

    const updatedRole = await roleRepository.save(role);

    res.json({
      message: "Role updated successfully",
      role: updatedRole,
    });
  } catch (error) {
    logger.error("Error updating role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete role
router.delete("/:id", authenticate, authorize([Permission.ADMIN_ROLES]), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const roleRepository = AppDataSource.getRepository(Role);
    
    const role = await roleRepository.findOne({
      where: { id },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }

    // Check if role is a system role
    if (role.isSystemRole) {
      return res.status(403).json({
        error: "Cannot delete system role"
      });
    }

    // Check if role is in use
    const userRepository = AppDataSource.getRepository(User);
    const usersWithRole = await userRepository.count({
      where: {
        roleIds: { $in: [role.id] } as any,
      },
    });

    if (usersWithRole > 0) {
      return res.status(409).json({
        error: "Cannot delete role that is assigned to users",
        usersWithRole,
      });
    }

    await roleRepository.remove(role);

    res.json({
      message: "Role deleted successfully",
      deletedRole: {
        id: role.id,
        name: role.name,
      },
    });
  } catch (error) {
    logger.error("Error deleting role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Assign role to user
router.post("/:roleId/assign/:userId", authenticate, authorize([Permission.ADMIN_ROLES]), async (req: AuthRequest, res: Response) => {
  try {
    const { roleId, userId } = req.params;

    const roleRepository = AppDataSource.getRepository(Role);
    const userRepository = AppDataSource.getRepository(User);

    // Verify role exists and is active
    const role = await roleRepository.findOne({
      where: { id: roleId, isActive: true },
    });

    if (!role) {
      return res.status(404).json({ error: "Role not found or inactive" });
    }

    // Verify user exists and is active
    const user = await userRepository.findOne({
      where: { id: userId } as any,
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ error: "User not found or inactive" });
    }

    // Check if user already has this role
    if (user.roleIds.includes(roleId)) {
      return res.status(409).json({
        error: "User already has this role"
      });
    }

    // Add role to user
    user.roleIds.push(roleId);
    user.updatedAt = new Date();

    await userRepository.save(user);

    res.json({
      message: "Role assigned successfully",
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        roleIds: user.roleIds,
      },
      role: {
        id: role.id,
        name: role.name,
      },
    });
  } catch (error) {
    logger.error("Error assigning role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove role from user
router.delete("/:roleId/unassign/:userId", authenticate, authorize([Permission.ADMIN_ROLES]), async (req: AuthRequest, res: Response) => {
  try {
    const { roleId, userId } = req.params;

    const userRepository = AppDataSource.getRepository(User);

    // Verify user exists
    const user = await userRepository.findOne({
      where: { id: userId } as any,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has this role
    const roleIndex = user.roleIds.indexOf(roleId);
    if (roleIndex === -1) {
      return res.status(409).json({
        error: "User does not have this role"
      });
    }

    // Remove role from user
    user.roleIds.splice(roleIndex, 1);
    user.updatedAt = new Date();

    await userRepository.save(user);

    res.json({
      message: "Role removed successfully",
      user: {
        id: user.id,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        roleIds: user.roleIds,
      },
    });
  } catch (error) {
    logger.error("Error removing role:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all available permissions
router.get("/permissions/list", authenticate, authorize([Permission.ADMIN_ROLES]), async (req: AuthRequest, res: Response) => {
  try {
    const permissions = Object.values(Permission).map(permission => ({
      key: permission,
      name: permission.split(':').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' '),
      category: permission.split(':')[0].toUpperCase(),
    }));

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, permission) => {
      const { category } = permission;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {} as Record<string, typeof permissions>);

    res.json({
      permissions,
      groupedPermissions,
      totalCount: permissions.length,
    });
  } catch (error) {
    logger.error("Error fetching permissions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
