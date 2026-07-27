
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('C:\Work\Project Ai\docx_skill_package\hasil\Hasil_Laporan_PKL_SMKN4_Niken.docx')
$doc.SaveAs('C:\Work\Project Ai\docx_skill_package\hasil\Hasil_Laporan_PKL_SMKN4_Niken.pdf', 17)
$doc.Close(0)
$word.Quit()
Write-Host "PDF converted successfully."
