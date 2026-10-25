// Chapter stories: a narrative chapter told scene by scene beside a small
// engraved map. Each scene names its verses, the place it happens, a phrase
// to mark in the text (copied exactly from the WEB), and a short note. Notes
// either retell the verses shown or carry source markers like the chapter notes.
// `circle` circles the phrase instead of underlining it.

// Places come from the Ruth journey in journeys.js.
const BETHLEHEM = { name: 'Bethlehem', lng: 35.2024, lat: 31.7054 }
const MOAB = { name: 'Moab', lng: 35.7, lat: 31.18 }
const RUTH_MAP = { west: 34.75, east: 36.15, south: 30.85, north: 32.15, places: { beth: BETHLEHEM, moab: MOAB }, route: ['beth', 'moab'], via: [35.56, 31.86] }

export const STORIES = {
  Ruth: {
    1: {
      map: RUTH_MAP,
      scenes: [
        { from: 1, to: 2, at: 'beth', title: 'A famine in Bethlehem', mark: 'famine',
          note: 'The events took place around 1100 BC, in the time of the judges [[tosn:Ruth 1:1]].' },
        { from: 3, to: 5, at: 'moab', title: 'Ten years in Moab', mark: 'about ten years',
          note: 'Far from home, Naomi loses her husband and then both of her sons.' },
        { from: 6, to: 7, at: 'moab', title: 'Bread again at home', mark: 'giving them bread',
          note: 'Naomi hears that the famine is over and sets out for home with her two daughters-in-law.' },
        { from: 8, to: 14, at: 'road', title: 'Orpah turns back', mark: 'Ruth stayed with her',
          note: 'Ruth “clung” to Naomi, the same Hebrew word used for husband and wife being joined [[tbd:018:Ruth, Book of]].' },
        { from: 15, to: 18, at: 'road', title: 'Ruth will not leave', mark: 'Your people will be my people, and your God my God',
          note: 'Ruth makes her promise in the LORD’s name [[tosn:Ruth 1:16-17]].' },
        { from: 19, to: 21, at: 'beth', title: 'Call me Mara', mark: 'Call me Mara', circle: true,
          note: 'Naomi asks to be called Mara, “bitter” [[tbd:018:Ruth, Book of]].' },
        { from: 22, to: 22, at: 'beth', title: 'The barley harvest begins', mark: 'beginning of barley harvest',
          note: 'They arrive just as the harvest starts. Chapter 2 opens in the fields.' },
      ],
    },
    2: {
      map: RUTH_MAP,
      scenes: [
        { from: 1, to: 3, at: 'beth', place: 'In a field near Bethlehem', title: 'Gleaning in a stranger’s field', mark: 'gleaned in the field after the reapers',
          note: 'Gleaning was one of God’s laws to feed the poor [[tosn:Ruth 2:2]] [[bible:Leviticus 19:9-10]].' },
        { from: 4, to: 7, at: 'beth', place: 'In Boaz’s field', title: 'Boaz notices Ruth', mark: 'Whose young lady is this?',
          note: 'As a relative of Naomi’s husband, Boaz could act as family redeemer [[tosn:Ruth 2:1]].' },
        { from: 8, to: 13, at: 'beth', place: 'In Boaz’s field', title: 'Under God’s wings', mark: 'under whose wings you have come to take refuge',
          note: 'Boaz pictures God as a bird protecting its young [[tbd:018:Ruth, Book of]] [[bible:Ruth 2:12]].' },
        { from: 14, to: 17, at: 'beth', place: 'In Boaz’s field', title: 'A place at the meal', mark: 'Come here, and eat some bread',
          note: 'Boaz quietly tells his young men to leave extra grain for her to gather.' },
        { from: 18, to: 23, at: 'beth', title: 'One of our near kinsmen', mark: 'one of our near kinsmen', circle: true,
          note: 'Naomi sees hope: Boaz is a close relative who could act as family redeemer [[tosn:Ruth 2:1]].' },
      ],
    },
    3: {
      map: RUTH_MAP,
      scenes: [
        { from: 1, to: 5, at: 'beth', title: 'Naomi’s plan', mark: 'shall I not seek rest for you',
          note: 'Naomi wants Ruth to find a home and a husband, and sends her to Boaz.' },
        { from: 6, to: 9, at: 'beth', place: 'On the threshing floor', title: 'Spread your garment over me', mark: 'spread the corner of your garment over your servant',
          note: 'This was Ruth’s way of asking Boaz to marry her [[tosn:Ruth 3:9]] [[bible:Ezekiel 16:8]].' },
        { from: 10, to: 13, at: 'beth', place: 'On the threshing floor', title: 'A worthy woman', mark: 'you are a worthy woman',
          note: 'Boaz agrees, but another relative has the first right to redeem the family.' },
        { from: 14, to: 18, at: 'beth', title: 'Home before daylight', mark: 'Wait, my daughter',
          note: 'Boaz protects Ruth’s good name by sending her home before daylight [[tbd:018:Ruth, Book of]].' },
      ],
    },
    4: {
      map: RUTH_MAP,
      scenes: [
        { from: 1, to: 6, at: 'beth', place: 'At the town gate', title: 'At the town gate', mark: 'I can’t redeem it',
          note: 'Boaz joins the duty of a family redeemer with the duty of marrying a dead relative’s widow [[tosn:Ruth 4:5]].' },
        { from: 7, to: 12, at: 'beth', place: 'At the town gate', title: 'The sandal and the witnesses', mark: 'We are witnesses',
          note: 'Handing over a sandal sealed the agreement in front of the elders.' },
        { from: 13, to: 17, at: 'beth', title: 'A son for Naomi', mark: 'better to you than seven sons',
          note: 'The women say Ruth means more to Naomi than seven sons, the greatest family blessing of the time [[tbd:018:Ruth, Book of]].' },
        { from: 18, to: 22, at: 'beth', title: 'The family line to David', mark: 'Jesse became the father of David', circle: true,
          note: 'The closing family line leads to King David [[tosn:Ruth 4:18-22]], and Ruth appears in Jesus’s family tree [[bible:Matthew 1:5]].' },
      ],
    },
  },
}

export const storyFor = (book, chapter) => STORIES[book]?.[chapter] || null
