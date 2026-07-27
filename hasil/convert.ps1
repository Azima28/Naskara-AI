 = New-Object -ComObject Word.Application
.Visible = False
 = .Documents.Open('C:\Work\Project Ai\docx_skill_package\hasil\Hasil_Laporan_PKL_SMKN4_Niken.docx')
 = .SaveAs('C:\Work\Project Ai\docx_skill_package\hasil\Hasil_Laporan_PKL_SMKN4_Niken.pdf', 17)
 = .Close(0)
 = .Quit()
Write-Host 'PDF GENERATED SUCCESSFULLY'
