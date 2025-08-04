# E-commerce Story Test Runner
# This script helps run the complete e-commerce system story test

Write-Host "🚀 E-commerce System Story Test Runner" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check if Node.js is available
Write-Host "🔍 Checking system requirements..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ to run this test." -ForegroundColor Red
    exit 1
}

# Check if the development server is running
Write-Host "🌐 Checking if development server is running..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/products" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Development server is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Development server is not running or not accessible" -ForegroundColor Red
    Write-Host "💡 Please start the development server first:" -ForegroundColor Cyan
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    $startServer = Read-Host "Would you like to start the development server now? (y/n)"
    
    if ($startServer -eq "y" -or $startServer -eq "Y") {
        Write-Host "🚀 Starting development server..." -ForegroundColor Yellow
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
        Write-Host "⏱️ Waiting for server to start (30 seconds)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000/api/products" -Method GET -TimeoutSec 5 -ErrorAction Stop
            Write-Host "✅ Development server is now running" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to start development server. Please start it manually and try again." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Please start the development server manually and run this script again." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "🎬 Starting E-commerce Story Test..." -ForegroundColor Green
Write-Host "This comprehensive test will:" -ForegroundColor Cyan
Write-Host "📋 Part 1: Setup admin user, products, shipping, and promotions" -ForegroundColor White
Write-Host "🛍️ Part 2: Simulate complete customer shopping journey" -ForegroundColor White
Write-Host "📦 Part 3: Handle post-order operations and customer support" -ForegroundColor White
Write-Host ""

# Run the story test
try {
    node ecommerce-story-test.js
    
    Write-Host ""
    Write-Host "🎉 Story test completed successfully!" -ForegroundColor Green
    Write-Host "Check the output above for detailed results." -ForegroundColor Cyan
    
} catch {
    Write-Host ""
    Write-Host "❌ Story test failed. Check the error messages above." -ForegroundColor Red
    Write-Host "💡 Common issues:" -ForegroundColor Yellow
    Write-Host "   - Database not initialized" -ForegroundColor White
    Write-Host "   - Migrations not applied" -ForegroundColor White
    Write-Host "   - Missing environment variables" -ForegroundColor White
    Write-Host "   - Server configuration issues" -ForegroundColor White
}

Write-Host ""
Write-Host "📚 Additional test scripts available:" -ForegroundColor Cyan
Write-Host "   cart-demo.js           - Cart management demo" -ForegroundColor White
Write-Host "   order-management-demo.js - Order processing demo" -ForegroundColor White
Write-Host "   customer-auth-test.js  - Authentication testing" -ForegroundColor White

Write-Host ""
Read-Host "Press Enter to exit"
