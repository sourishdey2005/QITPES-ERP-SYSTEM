# QITPES ERP - Global Theme Color Replacement Script
# Converts Blue theme to Orange theme across all pages

$pagesPath = "d:\ERP offline\QITPES-ERP-SYSTEM\pages"

# Color mappings: Blue -> Orange
$colorMappings = @{
    'bg-blue-50' = 'bg-orange-50';
    'bg-blue-100' = 'bg-orange-100';
    'bg-blue-400' = 'bg-orange-400';
    'bg-blue-500' = 'bg-orange-500';
    'bg-blue-600' = 'bg-orange-600';
    'bg-blue-700' = 'bg-orange-700';
    'text-blue-50' = 'text-orange-50';
    'text-blue-100' = 'text-orange-100';
    'text-blue-200' = 'text-orange-200';
    'text-blue-400' = 'text-orange-400';
    'text-blue-500' = 'text-orange-500';
    'text-blue-600' = 'text-orange-600';
    'text-blue-700' = 'text-orange-700';
    'border-blue-50' = 'border-orange-50';
    'border-blue-100' = 'border-orange-100';
    'border-blue-200' = 'border-orange-200';
    'border-blue-400' = 'border-orange-400';
    'border-blue-500' = 'border-orange-500';
    'border-blue-600' = 'border-orange-600';
    'hover:bg-blue-50' = 'hover:bg-orange-50';
    'hover:bg-blue-100' = 'hover:bg-orange-100';
    'hover:bg-blue-600' = 'hover:bg-orange-600';
    'hover:bg-blue-700' = 'hover:bg-orange-700';
    'hover:text-blue-600' = 'hover:text-orange-600';
    'hover:text-blue-700' = 'hover:text-orange-700';
    'hover:border-blue-100' = 'hover:border-orange-100';
    'hover:border-blue-400' = 'hover:border-orange-400';
    'hover:border-blue-500' = 'hover:border-orange-500';
    'focus:ring-blue-500' = 'focus:ring-orange-500';
    'focus:border-blue-500' = 'focus:border-orange-500';
    'shadow-blue-500' = 'shadow-orange-500';
    'shadow-blue-600' = 'shadow-orange-600';
    'group-hover:bg-blue-50' = 'group-hover:bg-orange-50';
    'group-hover:bg-blue-600' = 'group-hover:bg-orange-600';
    'group-hover:text-blue-200' = 'group-hover:text-orange-200';
    'group-hover:text-blue-600' = 'group-hover:text-orange-600';
    '#3b82f6' = '#f97316'
}

# Get all TSX files in pages directory
$files = Get-ChildItem -Path $pagesPath -Filter "*.tsx" -File

$totalFiles = $files.Count
$processedFiles = 0

Write-Host "Starting theme conversion: Blue -> Orange" -ForegroundColor Cyan
Write-Host "Total files to process: $totalFiles" -ForegroundColor Yellow

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Apply all color mappings
    foreach ($mapping in $colorMappings.GetEnumerator()) {
        $content = $content -replace [regex]::Escape($mapping.Key), $mapping.Value
    }
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $processedFiles++
        Write-Host "Updated: $($file.Name)" -ForegroundColor Green
    } else {
        Write-Host "Skipped: $($file.Name)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Theme conversion complete!" -ForegroundColor Cyan
Write-Host "Files updated: $processedFiles / $totalFiles" -ForegroundColor Yellow
