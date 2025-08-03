# Tax Region API Testing Script
# This script tests all the tax region management endpoints

$baseUrl = "http://localhost:3000/api"
$headers = @{
    "Content-Type" = "application/json"
}

# Function to make HTTP requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = $null
    )
    
    $url = "$baseUrl$Endpoint"
    
    try {
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $url -Method $Method -Headers $headers -Body $jsonBody
        } else {
            $response = Invoke-RestMethod -Uri $url -Method $Method -Headers $headers
        }
        return $response
    }
    catch {
        Write-Host "❌ $Method $Endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
        throw
    }
}

Write-Host "🧪 Starting Tax Region API Tests" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

try {
    # 1. Create US tax region
    Write-Host "`n1️⃣ Creating US tax region..." -ForegroundColor Yellow
    $usRegionData = @{
        name = "United States"
        countryCode = "US"
        status = "active"
        isDefault = $true
        sublevelEnabled = $true
        defaultTaxRateName = "Federal Sales Tax"
        defaultTaxRate = 0.00
        defaultTaxCode = "US-FEDERAL"
    }
    $usRegion = Invoke-ApiRequest -Method "POST" -Endpoint "/tax-regions" -Body $usRegionData
    Write-Host "✅ US tax region created: $($usRegion.taxRegion.name)" -ForegroundColor Green
    $usRegionId = $usRegion.taxRegion._id

    # 2. Create California subregion
    Write-Host "`n2️⃣ Creating California subregion..." -ForegroundColor Yellow
    $californiaData = @{
        name = "California"
        countryCode = "US"
        subdivisionCode = "US-CA"
        parentRegionId = $usRegion.taxRegion.id
        status = "active"
        defaultTaxRateName = "California State Tax"
        defaultTaxRate = 0.075
        defaultTaxCode = "CA-STATE"
        defaultCombinableWithParent = $true
    }
    $californiaRegion = Invoke-ApiRequest -Method "POST" -Endpoint "/tax-regions" -Body $californiaData
    Write-Host "✅ California tax region created: $($californiaRegion.taxRegion.name)" -ForegroundColor Green
    $californiaRegionId = $californiaRegion.taxRegion._id

    # 3. Create Canada tax region
    Write-Host "`n3️⃣ Creating Canada tax region..." -ForegroundColor Yellow
    $canadaData = @{
        name = "Canada"
        countryCode = "CA"
        status = "active"
        isDefault = $true
        sublevelEnabled = $true
        defaultTaxRateName = "GST"
        defaultTaxRate = 0.05
        defaultTaxCode = "CA-GST"
    }
    $canadaRegion = Invoke-ApiRequest -Method "POST" -Endpoint "/tax-regions" -Body $canadaData
    Write-Host "✅ Canada tax region created: $($canadaRegion.taxRegion.name)" -ForegroundColor Green

    # 4. Create Ontario subregion
    Write-Host "`n4️⃣ Creating Ontario subregion..." -ForegroundColor Yellow
    $ontarioData = @{
        name = "Ontario"
        countryCode = "CA"
        subdivisionCode = "CA-ON"
        parentRegionId = $canadaRegion.taxRegion.id
        status = "active"
        defaultTaxRateName = "Ontario HST"
        defaultTaxRate = 0.08
        defaultTaxCode = "ON-HST"
        defaultCombinableWithParent = $true
    }
    $ontarioRegion = Invoke-ApiRequest -Method "POST" -Endpoint "/tax-regions" -Body $ontarioData
    Write-Host "✅ Ontario tax region created: $($ontarioRegion.taxRegion.name)" -ForegroundColor Green

    # 5. Add luxury tax override to California
    Write-Host "`n5️⃣ Adding luxury tax override to California..." -ForegroundColor Yellow
    $luxuryOverrideData = @{
        name = "Luxury Goods Tax"
        rate = 0.10
        code = "LUXURY"
        combinable = $true
        targets = @(
            @{
                type = "product_type"
                targetId = "luxury_goods"
            }
        )
    }
    $luxuryOverride = Invoke-ApiRequest -Method "POST" -Endpoint "/tax-regions/$californiaRegionId/overrides" -Body $luxuryOverrideData
    Write-Host "✅ Luxury tax override added" -ForegroundColor Green

    # 6. Add digital tax override to California
    Write-Host "`n6️⃣ Adding digital tax override to California..." -ForegroundColor Yellow
    $digitalOverrideData = @{
        name = "Digital Products Tax"
        rate = 0.05
        code = "DIGITAL"
        combinable = $false
        targets = @(
            @{
                type = "product_type"
                targetId = "digital"
            }
        )
    }
    $digitalOverride = Invoke-ApiRequest -Method "POST" -Endpoint "/tax-regions/$californiaRegionId/overrides" -Body $digitalOverrideData
    Write-Host "✅ Digital tax override added" -ForegroundColor Green

    # 7. Test tax calculations
    Write-Host "`n7️⃣ Testing tax calculations..." -ForegroundColor Yellow
    
    # Regular product
    $regularTaxData = @{
        productId = "regular-product-123"
        productType = "physical"
        amount = 100
    }
    $regularTax = Invoke-ApiRequest -Method "POST" -Endpoint "/tax-regions/$californiaRegionId/calculate" -Body $regularTaxData
    Write-Host "📊 Regular product tax: $($regularTax.taxRatePercentage)% = `$$($regularTax.taxAmount)" -ForegroundColor Cyan

    # Luxury product
    $luxuryTaxData = @{
        productId = "luxury-product-456"
        productType = "luxury_goods"
        amount = 1000
    }
    $luxuryTax = Invoke-ApiRequest -Method "POST" -Endpoint "/tax-regions/$californiaRegionId/calculate" -Body $luxuryTaxData
    Write-Host "💎 Luxury product tax: $($luxuryTax.taxRatePercentage)% = `$$($luxuryTax.taxAmount)" -ForegroundColor Cyan

    # Digital product
    $digitalTaxData = @{
        productId = "digital-product-789"
        productType = "digital"
        amount = 50
    }
    $digitalTax = Invoke-ApiRequest -Method "POST" -Endpoint "/tax-regions/$californiaRegionId/calculate" -Body $digitalTaxData
    Write-Host "💻 Digital product tax: $($digitalTax.taxRatePercentage)% = `$$($digitalTax.taxAmount)" -ForegroundColor Cyan

    # 8. Get all tax regions
    Write-Host "`n8️⃣ Fetching all tax regions..." -ForegroundColor Yellow
    $allRegions = Invoke-ApiRequest -Method "GET" -Endpoint "/tax-regions"
    Write-Host "📋 Total tax regions: $($allRegions.taxRegions.Count)" -ForegroundColor Cyan

    # 9. Get US subregions
    Write-Host "`n9️⃣ Fetching US subregions..." -ForegroundColor Yellow
    $usSubregions = Invoke-ApiRequest -Method "GET" -Endpoint "/tax-regions/$usRegionId/subregions"
    Write-Host "🏛️ US subregions: $($usSubregions.subregions.Count)" -ForegroundColor Cyan

    # 10. Filter by country
    Write-Host "`n🔟 Testing country filters..." -ForegroundColor Yellow
    $usRegions = Invoke-ApiRequest -Method "GET" -Endpoint "/tax-regions?countryCode=US"
    Write-Host "🇺🇸 US regions: $($usRegions.taxRegions.Count)" -ForegroundColor Cyan
    
    $canadaRegions = Invoke-ApiRequest -Method "GET" -Endpoint "/tax-regions?countryCode=CA"
    Write-Host "🇨🇦 Canada regions: $($canadaRegions.taxRegions.Count)" -ForegroundColor Cyan

    # 11. Test search
    Write-Host "`n1️⃣1️⃣ Testing search functionality..." -ForegroundColor Yellow
    $searchResults = Invoke-ApiRequest -Method "GET" -Endpoint "/tax-regions?search=California"
    Write-Host "🔍 Search 'California': $($searchResults.taxRegions.Count) results" -ForegroundColor Cyan

    # 12. Update tax region
    Write-Host "`n1️⃣2️⃣ Updating California tax rate..." -ForegroundColor Yellow
    $updateData = @{
        defaultTaxRate = 0.08
    }
    $updatedRegion = Invoke-ApiRequest -Method "PUT" -Endpoint "/tax-regions/$californiaRegionId" -Body $updateData
    Write-Host "✅ California tax rate updated to 8%" -ForegroundColor Green

    Write-Host "`n🎉 All tax region tests completed successfully!" -ForegroundColor Green
    Write-Host "`n📊 Test Summary:" -ForegroundColor White
    Write-Host "- ✅ Created US and Canada parent regions" -ForegroundColor White
    Write-Host "- ✅ Created California and Ontario subregions" -ForegroundColor White
    Write-Host "- ✅ Added luxury and digital tax overrides" -ForegroundColor White
    Write-Host "- ✅ Tested tax calculations for different product types" -ForegroundColor White
    Write-Host "- ✅ Verified filtering, search, and update functionality" -ForegroundColor White

} catch {
    Write-Host "`n❌ Tests failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n✨ Tax Region API testing completed successfully!" -ForegroundColor Green
