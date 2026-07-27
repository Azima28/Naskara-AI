# docx-js (Node.js) Reference

Alternative approach jika python-docx tidak tersedia. **Untuk PKL, selalu pakai python-docx.**

## Dependencies

```bash
npm install -g docx
```

## Page Size

```javascript
sections: [{
  properties: {
    page: {
      size: { width: 12240, height: 15840 },  // US Letter
      margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
    }
  },
  children: [/* content */]
}]
```

| Paper | Width | Height |
|-------|-------|--------|
| US Letter | 12,240 | 15,840 |
| A4 | 11,906 | 16,838 |

## Headings

```javascript
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Times New Roman", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", quickFormat: true,
        run: { size: 28, bold: true, font: "Times New Roman" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", quickFormat: true,
        run: { size: 24, bold: true, font: "Times New Roman" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 } },
    ]
  },
  sections: [{ children: [...] }]
});
```

## Lists

```javascript
const doc = new Document({
  numbering: {
    config: [
      { reference: "numbers",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    children: [
      new Paragraph({ numbering: { reference: "numbers", level: 0 },
        children: [new TextRun("Item 1")] }),
    ]
  }]
});
```

## Page Break, TOC, Images, Header/Footer

```javascript
// Page break
new Paragraph({ children: [new PageBreak()] })

// TOC
new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" })

// Image
new Paragraph({
  children: [new ImageRun({
    type: "png",
    data: fs.readFileSync("image.png"),
    transformation: { width: 200, height: 150 },
  })]
})

// Footer with page number
sections: [{
  footers: {
    default: new Footer({ children: [new Paragraph({
      children: [new TextRun("Page "), new TextRun({ children: [PageNumber.CURRENT] })]
    })] })
  },
}]
```
