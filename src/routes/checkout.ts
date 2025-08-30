import { Router, Request, Response } from "express";
import { CartToOrderService } from "../utils/cartToOrderService";

const router = Router();
const service = new CartToOrderService();

router.post("/", async (req: Request, res: Response) => {
  const { cartId, customer, shippingMethod, payment } = req.body;

  if (!cartId || !payment?.paymentIntentId) {
    return res.status(400).json({
      error: "cartId and payment.paymentIntentId are required",
    });
  }

  try {
    const result = await service.checkout({
      cartId,
      customer,
      shippingMethod,
      payment,
    });

    if ((result as any).errors) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error("Checkout error:", error);
    res.status(500).json({ error: error.message || "Checkout failed" });
  }
});

export default router;
