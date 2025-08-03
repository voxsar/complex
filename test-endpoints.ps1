# Order Management System Endpoint Test
Write-Host "🚀 Testing Order Management System Endpoints" -ForegroundColor Green
Write-Host ""

$baseUrl = "http://localhost:3000"
$endpoints = @(
    "/health",
    "/api/sales-channels", 
    "/api/price-lists",
    "/api/orders",
    "/api/order-returns", 
    "/api/order-claims",
    "/api/order-exchanges",
    "/api/payments",
    "/api/promotions",
    "/api/campaigns",
    "/api/inventory",
    "/api/product-options",
    "/api/products",
    "/api/categories",
    "/api/customers",
    "/api/users"
)

Write-Host "Testing endpoints..." -ForegroundColor Yellow
Write-Host ""

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -ErrorAction Stop
        $status = $response.StatusCode
        $emoji = if ($status -eq 200) { "✅" } else { "⚠️" }
        Write-Host "$emoji $endpoint - Status: $status" -ForegroundColor $(if ($status -eq 200) { "Green" } else { "Yellow" })
    }
    catch {
        Write-Host "❌ $endpoint - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 Order Management System Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Available Features:" -ForegroundColor Cyan
Write-Host "  • Sales Channel Management" -ForegroundColor White
Write-Host "  • Price List Management" -ForegroundColor White  
Write-Host "  • Multi-Currency Orders" -ForegroundColor White
Write-Host "  • Payment Processing" -ForegroundColor White
Write-Host "  • Fulfillment Tracking" -ForegroundColor White
Write-Host "  • Order Returns" -ForegroundColor White
Write-Host "  • Order Claims" -ForegroundColor White
Write-Host "  • Order Exchanges" -ForegroundColor White
Write-Host "  • Product and Inventory Management" -ForegroundColor White
Write-Host "  • Customer Management" -ForegroundColor White
Write-Host "  • Promotions and Campaigns" -ForegroundColor White
Write-Host ""
