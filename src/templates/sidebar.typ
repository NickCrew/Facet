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

#set page(
  paper: "us-letter",
  margin: (
    top: to-inch(theme.marginTop),
    bottom: to-inch(theme.marginBottom),
    left: 0pt, // Full bleed for sidebar
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

#let sidebar-width = to-inch(theme.at("sidebarWidth", default: 2.2))
#let col-gap = to-pt(theme.at("columnGap", default: 24))

#grid(
  columns: (sidebar-width, 1fr),
  column-gutter: col-gap,
  // Sidebar
  rect(
    fill: to-color(theme.at("sidebarColor", default: (248, 249, 250))),
    width: 100%,
    height: 100%,
    inset: (top: to-inch(theme.marginTop), bottom: to-inch(theme.marginBottom), left: to-inch(theme.marginLeft), right: col-gap/2),
    [
      #set align(center)
      #set text(fill: to-color(theme.colorHeading))
      
      #text(
        size: to-pt(theme.sizeName),
        weight: if theme.nameBold { "bold" } else { "regular" },
        tracking: to-pt(theme.nameLetterSpacing),
      )[#data.name]
      
      #v(to-pt(theme.contactGapAfter))
      
      #set text(size: to-pt(theme.sizeContact))
      #data.contactLine
      
      #v(8pt)
      
      #for link in data.contactLinks [
        #link.text 
      ]
      
      #v(to-pt(theme.sectionGapBefore))
      
      #set align(left)
      
      #if data.skillGroups.len() > 0 [
        #text(weight: "bold", size: to-pt(theme.sizeSectionHeader))[SKILLS]
        #v(4pt)
        #for group in data.skillGroups [
          #text(weight: "bold")[#group.label:] #group.content 
          #v(to-pt(theme.competencyGap))
        ]
      ]
      
      #v(to-pt(theme.sectionGapBefore))
      
      #if data.education.len() > 0 [
        #text(weight: "bold", size: to-pt(theme.sizeSectionHeader))[EDUCATION]
        #v(4pt)
        #for entry in data.education [
          #text(weight: if theme.educationSchoolBold { "bold" } else { "regular" })[#entry.school]
          #entry.degree#if entry.year != none [ (#entry.year)]
          #v(4pt)
        ]
      ]

      #if data.certifications.len() > 0 [
        #v(to-pt(theme.sectionGapBefore))
        #text(weight: "bold", size: to-pt(theme.sizeSectionHeader))[CERTIFICATIONS]
        #v(4pt)
        #for cert in data.certifications [
          #text(weight: "bold")[#cert.name]
          #cert.issuer#if cert.date != none [ (#cert.date)]
          #v(4pt)
        ]
      ]
    ]
  ),
  // Main Content
  block(
    inset: (top: to-inch(theme.marginTop), bottom: to-inch(theme.marginBottom)),
    [
      #if data.targetLine != none [
        #set align(align-map.at(theme.nameAlignment))
        #text(
          size: to-pt(theme.sizeBody),
          fill: to-color(theme.colorSection),
          weight: "bold",
        )[#data.targetLine]
        #v(to-pt(theme.contactGapAfter))
      ]

      #if data.profile != none [
        #data.profile
        #v(to-pt(theme.sectionGapAfter))
      ]

      #let section-header(title) = [
        #v(to-pt(theme.sectionGapBefore))
        #set text(
          size: to-pt(theme.sizeSectionHeader),
          weight: "bold",
          fill: to-color(theme.colorSection),
          tracking: to-pt(theme.sectionHeaderLetterSpacing),
        )
        #let label = if theme.sectionHeaderStyle == "caps-rule" { upper(title) } else { title }
        #label
        #if theme.sectionHeaderStyle == "caps-rule" or theme.sectionHeaderStyle == "bold-rule" [
          #v(to-pt(theme.sectionRuleGap))
          #line(length: 100%, stroke: to-pt(theme.sectionRuleWeight) + to-color(theme.colorRule))
        ]
        #v(to-pt(theme.sectionGapAfter))
      ]

      #if data.roles.len() > 0 [
        #section-header("Experience")
        #for role in data.roles [
          #block(width: 100%, breakable: true)[
            #grid(
              columns: (1fr, auto),
              [
              #text(weight: if theme.companyBold { "bold" } else { "regular" }, size: to-pt(theme.sizeCompanyName), fill: to-color(theme.colorHeading))[#role.company]
              #if role.subtitle != none and role.subtitle != "" [
                #text(size: to-pt(theme.sizeSmall))[ ]
                #text(style: if theme.subtitleItalic { "italic" } else { "normal" }, fill: to-color(theme.subtitleColor), size: to-pt(theme.sizeSmall))[#role.subtitle]
              ]
            ],
              [#text(fill: to-color(theme.datesColor), size: to-pt(theme.sizeSmall))[#role.dates]]
            )
            #grid(
              columns: (1fr, auto),
              [#text(style: if theme.roleTitleItalic { "italic" } else { "normal" }, size: to-pt(theme.sizeRoleTitle), fill: to-color(theme.roleTitleColor))[#role.title]],
              [#text(fill: to-color(theme.colorDim), size: to-pt(theme.sizeSmall))[#role.location]]
            )
            #v(to-pt(theme.roleLineGapAfter))
            #for bullet in role.bullets [
              #grid(
                columns: (to-pt(theme.bulletIndent), 1fr),
                [#text(fill: to-color(theme.colorSection))[#if theme.bulletChar != "none" { theme.bulletChar }]],
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
            #text(weight: if theme.projectNameBold { "bold" } else { "regular" }, fill: to-color(theme.colorHeading))[#project.name]
            #if project.urlText != none [
              #h(4pt) #text(size: to-pt(theme.projectUrlSize), fill: to-color(theme.projectUrlColor))[#project.urlText]
            ]
            #v(2pt)
            #project.text
            #v(to-pt(theme.projectGap))
          ]
        ]
      ]
    ]
  )
)
