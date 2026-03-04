#let data = json.decode(sys.inputs.data)
#let theme = json.decode(sys.inputs.theme)

#let to-color(value) = rgb(value.at(0), value.at(1), value.at(2))
#let to-pt(value) = value * 1pt
#let to-inch(value) = value * 1in
#let align-map = (
  "left": left,
  "center": center,
  "right": right,
)

#let sidebar-width = to-inch(theme.at("sidebarWidth", default: 2.2))
#let sidebar-color = to-color(theme.at("sidebarColor", default: (248, 249, 250)))
#let col-gap = to-pt(theme.at("columnGap", default: 24))

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
  lang: "en",
  fallback: true,
)

#set par(leading: if theme.lineHeight <= 1 { 0pt } else { (theme.lineHeight - 1) * to-pt(theme.sizeBody) })

#set align(align-map.at(theme.nameAlignment))

#text(
  size: to-pt(theme.sizeName),
  fill: to-color(theme.colorHeading),
  weight: if theme.nameBold { "bold" } else { "regular" },
  tracking: to-pt(theme.nameLetterSpacing),
)[#upper(data.name)]

#v(to-pt(theme.contactGapAfter))

#set text(size: to-pt(theme.sizeContact))
#data.contactLine

#for link in data.contactLinks [
  #h(8pt) #link.text
]

#v(to-pt(theme.sectionGapBefore))

#let section-header(title) = [
  #v(to-pt(theme.sectionGapBefore))
  #set align(left)
  #set text(
    size: to-pt(theme.sizeSectionHeader),
    weight: "bold",
    fill: to-color(theme.colorSection),
    tracking: to-pt(theme.sectionHeaderLetterSpacing),
  )
  #let label = if theme.sectionHeaderStyle == "caps-rule" { upper(title) } else { title }
  #label
  #v(to-pt(theme.sectionRuleGap))
  #line(length: 100%, stroke: 0.5pt + to-color(theme.colorRule))
  #v(to-pt(theme.sectionGapAfter))
]

#if data.targetLine != none [
  #set align(align-map.at(theme.nameAlignment))
  #text(style: "italic", fill: to-color(theme.colorSection))[#data.targetLine]
  #v(to-pt(theme.contactGapAfter))
]

#if data.profile != none [
  #set align(left)
  #data.profile
  #v(to-pt(theme.sectionGapAfter))
]

#if data.skillGroups.len() > 0 [
  #section-header("Skills")
  #for group in data.skillGroups [
    #text(weight: "bold")[#group.label:] #group.content 
    #v(to-pt(theme.competencyGap))
  ]
]

#if data.roles.len() > 0 [
  #section-header("Experience")
  #for role in data.roles [
    #block(width: 100%, breakable: true)[
      #set align(left)
      #grid(
        columns: (1fr, auto),
        [#text(weight: "bold", size: to-pt(theme.sizeCompanyName))[#role.company]],
        [#text(fill: to-color(theme.datesColor), size: to-pt(theme.sizeSmall))[#role.dates]]
      )
      #grid(
        columns: (1fr, auto),
        [#text(style: "italic", size: to-pt(theme.sizeRoleTitle))[#role.title]],
        [#text(fill: to-color(theme.colorDim), size: to-pt(theme.sizeSmall))[#role.location]]
      )
      #v(to-pt(theme.roleLineGapAfter))
      #for bullet in role.bullets [
        #grid(
          columns: (to-pt(theme.bulletIndent), 1fr),
          [#if theme.bulletChar != "none" { theme.bulletChar }],
          [#bullet]
        )
        #v(to-pt(theme.bulletGap))
      ]
      #v(to-pt(theme.roleGap))
    ]
  ]
]

#if data.projects.len() > 0 [
  #section-header("Projects")
  #for project in data.projects [
    #block(width: 100%, breakable: true)[
      #text(weight: "bold")[#project.name]
      #if project.urlText != none [
        #h(4pt) #text(size: to-pt(theme.projectUrlSize), fill: to-color(theme.projectUrlColor))[#project.urlText]
      ]
      #v(2pt)
      #project.text
      #v(to-pt(theme.projectGap))
    ]
  ]
]

#if data.education.len() > 0 [
  #section-header("Education")
  #for entry in data.education [
    #grid(
      columns: (1fr, auto),
      [#text(weight: "bold")[#entry.school]],
      [#if entry.year != none [#entry.year]]
    )
    #entry.degree, #entry.location
    #v(4pt)
  ]
]
