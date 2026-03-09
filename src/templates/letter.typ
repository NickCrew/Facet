#let data = json.decode(sys.inputs.data)
#let theme = json.decode(sys.inputs.theme)

#let to-color(value) = rgb(value.at(0), value.at(1), value.at(2))
#let to-pt(value) = value * 1pt
#let to-inch(value) = value * 1in
#let align-mode(value) = if value == "center" {
  center
} else if value == "right" {
  right
} else {
  left
}

#set document(
  title: data.metadata.title,
  author: (data.metadata.author,),
)

#set page(
  paper: "us-letter",
  margin: (
    top: to-inch(theme.marginTop),
    bottom: to-inch(theme.marginBottom),
    left: to-inch(theme.marginLeft),
    right: to-inch(theme.marginRight),
  ),
)

#set text(
  font: theme.fontBody,
  size: to-pt(theme.sizeBody),
  fill: to-color(theme.colorBody),
)

#set par(
  leading: if theme.lineHeight <= 1 {
    0pt
  } else {
    to-pt((theme.lineHeight - 1) * theme.sizeBody)
  },
  spacing: 0pt,
)

// Header
#align(align-mode(theme.nameAlignment))[
  #text(
    font: theme.fontHeading,
    size: to-pt(theme.sizeName),
    weight: if theme.nameBold { "bold" } else { "regular" },
    tracking: to-pt(theme.nameLetterSpacing),
    fill: to-color(theme.colorHeading),
  )[#data.name]
]

#v(to-pt(theme.contactGapAfter * 0.4))
#if data.contactLine != none and data.contactLine != "" [
  #align(align-mode(theme.contactAlignment))[
    #text(size: to-pt(theme.sizeContact), fill: to-color(theme.colorDim))[#data.contactLine]
  ]
  #v(to-pt(theme.contactGapAfter * 0.15))
]

#if data.contactLinks.len() > 0 [
  #align(align-mode(theme.contactAlignment))[
    #for (index, contactLink) in data.contactLinks.enumerate() [
      #if index > 0 [
        #text(size: to-pt(theme.sizeContact), fill: to-color(theme.colorDim))[ | ]
      ]
      #link(contactLink.href)[
        #text(size: to-pt(theme.sizeContact), fill: to-color(theme.colorDim))[#contactLink.text]
      ]
    ]
  ]
]

#v(to-pt(theme.contactGapAfter))

// Recipient / Date / Greeting
#v(to-pt(theme.sectionGapBefore))
#text(weight: "bold")[#data.date]
#v(to-pt(theme.paragraphGap))

#if data.recipient != none and data.recipient != "" [
  #text()[#data.recipient]
  #v(to-pt(theme.paragraphGap))
]

#text()[#data.greeting]
#v(to-pt(theme.paragraphGap))

// Body
#for p in data.paragraphs [
  #text()[#p]
  #v(to-pt(theme.paragraphGap))
]

// Sign-off
#v(to-pt(theme.sectionGapBefore))
#text()[#data.signOff]
