/**
 * SOP Wells - Compressed reference libraries for Saga and Logo
 * K-tagged archetypes, characters, locations, and patterns
 */

export interface Well {
	id: string;
	name: string;
	k: string; // K-coordinate like "+7H" or "-QS"
	type: 'character' | 'location' | 'structure' | 'theme';
	description: string;
	examples: string[]; // Open source story examples
	howToUse: string; // How to apply to writer's work
}

// Character Archetypes - Full Deck
export const CHARACTER_WELLS: Well[] = [
	// HEARTS - Emotional/Relational
	{
		id: 'innocent-heart',
		name: 'The Innocent Heart',
		k: '+AH',
		type: 'character',
		description: 'Pure beginning. Uncorrupted potential. The child who asks "why?" and means it.',
		examples: ['Scout Finch', 'Cinderella (start)', 'Bastian (Neverending Story)', 'Pi (young)'],
		howToUse: 'Story openings. What must be protected. What the world tries to take. The +AH shows what\'s worth fighting for.'
	},
	{
		id: 'bonded-pair',
		name: 'The Bonded Pair',
		k: '+2H',
		type: 'character',
		description: 'Two who are stronger together. Partnership as power. Each completes what the other lacks.',
		examples: ['Holmes & Watson', 'Frodo & Sam', 'Thelma & Louise', 'Han & Chewie'],
		howToUse: 'When one character isn\'t enough. The +2H shows that some journeys require a witness, a partner, a complement.'
	},
	{
		id: 'found-family',
		name: 'The Found Family',
		k: '+3H',
		type: 'character',
		description: 'Chosen bonds over blood. Misfits who become each other\'s home.',
		examples: ['The Fellowship', 'Firefly crew', 'The Breakfast Club', 'Guardians of the Galaxy'],
		howToUse: 'When belonging matters more than origin. The +3H shows that family is action, not accident.'
	},
	{
		id: 'sanctuary-keeper',
		name: 'The Sanctuary Keeper',
		k: '+4H',
		type: 'character',
		description: 'One who creates safe harbor. The mother, the host, the guardian of rest.',
		examples: ['Molly Weasley', 'Ma Joad', 'Alfred', 'Grandma Fa (Mulan)'],
		howToUse: 'When heroes need restoration. The +4H character gives the gift of pause, of unconditional acceptance.'
	},
	{
		id: 'wounded-healer',
		name: 'The Wounded Healer',
		k: '+6H',
		type: 'character',
		description: 'One who transforms their own pain into medicine for others. Empathy born from suffering.',
		examples: ['Chiron', 'Samwise Gamgee', 'Hagrid', 'Doc Holliday (Tombstone)'],
		howToUse: 'When your story needs someone who can hold space for pain. The +6H knows darkness and chooses light anyway.'
	},
	{
		id: 'hopeful-journeyer',
		name: 'The Hopeful Journeyer',
		k: '+7H',
		type: 'character',
		description: 'One who sets out with heart open, believing the world can be better. Hope as choice, not naivety.',
		examples: ['Frodo Baggins', 'Dorothy Gale', 'Luke Skywalker (early)', 'Anne Shirley'],
		howToUse: 'When your protagonist must carry light into darkness. They don\'t ignore danger - they walk toward it anyway.'
	},
	{
		id: 'loyal-shadow',
		name: 'The Loyal Shadow',
		k: '+9H',
		type: 'character',
		description: 'The one who stays. Not the hero, but the hero\'s anchor. Loyalty as the story\'s emotional core.',
		examples: ['Samwise Gamgee', 'Dr. Watson', 'Ron Weasley', 'Horatio'],
		howToUse: 'When your protagonist needs grounding. The +9H reminds us love is shown through presence, not grand gestures.'
	},
	{
		id: 'loves-arithmetic',
		name: 'The Heart Balanced',
		k: '+10H',
		type: 'character',
		description: 'Love fully realized. The one who has learned to give and receive in equal measure.',
		examples: ['Elizabeth Bennet (end)', 'Aragorn & Arwen', 'Wall-E & Eve', 'Westley & Buttercup'],
		howToUse: 'Resolution of romantic arcs. The +10H shows love that has been tested and proven genuine.'
	},
	{
		id: 'heart-prince',
		name: 'The Heart Prince',
		k: '+PH',
		type: 'character',
		description: 'Young romantic. Passion before wisdom. Love as the first great adventure.',
		examples: ['Romeo', 'Aladdin', 'Tristan (Stardust)', 'Pip (early)'],
		howToUse: 'When love launches the journey. The +PH character learns that love is not just feeling but becoming.'
	},
	{
		id: 'heart-knight',
		name: 'The Heart Knight',
		k: '+NH',
		type: 'character',
		description: 'One who serves love through action. Devotion expressed as protection, quest, sacrifice.',
		examples: ['Brienne of Tarth', 'Sydney Carton', 'Lancelot', 'Beast (transformed)'],
		howToUse: 'When love must prove itself through deeds. The +NH shows devotion that costs everything.'
	},
	{
		id: 'heart-queen',
		name: 'The Heart Queen',
		k: '+QH',
		type: 'character',
		description: 'Emotional sovereignty. One who rules from compassion, whose power is love itself.',
		examples: ['Galadriel', 'Grandmother Willow', 'Mrs. Whatsit', 'Aslan'],
		howToUse: 'When wisdom and warmth combine. The +QH guides through love, not control.'
	},
	{
		id: 'heart-king',
		name: 'The Heart King',
		k: '+KH',
		type: 'character',
		description: 'Mastery of emotional truth. The father who has learned, the lover who has grown, the heart made wise.',
		examples: ['Atticus Finch', 'Mufasa', 'Dumbledore (at best)', 'Uncle Iroh'],
		howToUse: 'When your story needs a north star. The +KH embodies what love looks like when it has matured.'
	},
	{
		id: 'abandoned-heart',
		name: 'The Abandoned Heart',
		k: '-3H',
		type: 'character',
		description: 'Betrayed trust. One whose love was weaponized against them. Wounded where they were most open.',
		examples: ['Miss Havisham', 'Snape', 'Maleficent', 'Daenerys (late)'],
		howToUse: 'When exploring how love curdles. The -3H asks: what does the heart become when it closes forever?'
	},
	{
		id: 'jealous-heart',
		name: 'The Jealous Heart',
		k: '-6H',
		type: 'character',
		description: 'Love twisted to possession. One who confuses having with holding.',
		examples: ['Othello (corrupted)', 'Annie Wilkes', 'Heathcliff', 'Frollo'],
		howToUse: 'When love becomes cage. The -6H shows the shadow side of devotion - when "I love you" means "I own you."'
	},

	// SPADES - Mental/Truth
	{
		id: 'truth-speaker',
		name: 'The Truth Speaker',
		k: '+AS',
		type: 'character',
		description: 'The one who says what no one wants to hear. Marginalized until proven right - often too late.',
		examples: ['Cassandra', 'The Fool (King Lear)', 'Tiresias', 'Luna Lovegood'],
		howToUse: 'When your story needs uncomfortable truths. The +AS sees clearly but isn\'t believed.'
	},
	{
		id: 'keen-observer',
		name: 'The Keen Observer',
		k: '+3S',
		type: 'character',
		description: 'One who watches before acting. Gathers truth through patience and attention.',
		examples: ['Sherlock Holmes', 'Clarice Starling', 'Atticus (in court)', 'Wednesday Addams'],
		howToUse: 'When the truth must be assembled from fragments. The +3S shows that seeing is a skill.'
	},
	{
		id: 'reluctant-knower',
		name: 'The Reluctant Knower',
		k: '+5S',
		type: 'character',
		description: 'One burdened with truth they didn\'t seek. Knowledge as weight, as responsibility.',
		examples: ['Neo (mid-Matrix)', 'Cassandra', 'Frodo (ring-knowledge)', 'Paul Atreides'],
		howToUse: 'When knowing costs. The +5S asks: what truths would you rather not carry?'
	},
	{
		id: 'strategist',
		name: 'The Strategist',
		k: '+7S',
		type: 'character',
		description: 'Mind as weapon. One who wins before the battle by seeing further than others.',
		examples: ['Tyrion', 'Sherlock', 'Ender Wiggin', 'Professor X'],
		howToUse: 'When cleverness is power. The +7S character wins through thinking, not force.'
	},
	{
		id: 'spade-knight',
		name: 'The Mind Knight',
		k: '+NS',
		type: 'character',
		description: 'Intellect in service of cause. The advocate, the investigator, the defender of reason.',
		examples: ['Atticus Finch (trial)', 'Hermione', 'Spock', 'Shuri'],
		howToUse: 'When justice requires proof. The +NS fights with evidence and argument.'
	},
	{
		id: 'scheming-power',
		name: 'The Scheming Power',
		k: '-QS',
		type: 'character',
		description: 'Intelligence weaponized for control. Sees people as pieces. Charming on the surface.',
		examples: ['Iago', 'Lady Macbeth', 'Cersei Lannister', 'Scar'],
		howToUse: 'Antagonist who destroys through manipulation. The -QS makes the protagonist doubt themselves.'
	},
	{
		id: 'mad-genius',
		name: 'The Mad Genius',
		k: '-KS',
		type: 'character',
		description: 'Brilliance uncoupled from wisdom. Mind that has outrun its moorings.',
		examples: ['Moriarty', 'Hannibal Lecter', 'The Joker (chaos)', 'Dr. Frankenstein'],
		howToUse: 'When intellect alone isn\'t enough. The -KS shows mind without heart, knowing without wisdom.'
	},

	// DIAMONDS - Material/Physical
	{
		id: 'gentle-monster',
		name: 'The Gentle Monster',
		k: '+5D',
		type: 'character',
		description: 'Feared for appearance, kind in essence. Surfaces lie.',
		examples: ['Frankenstein\'s Monster', 'The Beast', 'Hagrid', 'The Iron Giant'],
		howToUse: 'When exploring prejudice and true nature. The +5D asks: what makes someone monstrous?'
	},
	{
		id: 'maker',
		name: 'The Maker',
		k: '+7D',
		type: 'character',
		description: 'One who builds, crafts, creates tangible things. Mastery through hands.',
		examples: ['Hephaestus', 'Tony Stark', 'Gepetto', 'Samwise (gardener)'],
		howToUse: 'When creation matters. The +7D shows that making is a form of love.'
	},
	{
		id: 'diamond-queen',
		name: 'The Earth Queen',
		k: '+QD',
		type: 'character',
		description: 'Sovereign of the material realm. Abundance, provision, practical wisdom.',
		examples: ['Demeter', 'Lady of the Green Kirtle', 'Molly Weasley', 'Ma Ingalls'],
		howToUse: 'When grounding is power. The +QD shows that tending the physical is sacred work.'
	},
	{
		id: 'fallen-king',
		name: 'The Fallen King',
		k: '-KD',
		type: 'character',
		description: 'Power corrupted or lost. Once great, now diminished by their own choices.',
		examples: ['King Lear', 'Ozymandias', 'Théoden (under Wormtongue)', 'Walter White'],
		howToUse: 'How power fails. The -KD shows when the crown becomes heavier than the head.'
	},
	{
		id: 'miser',
		name: 'The Miser',
		k: '-7D',
		type: 'character',
		description: 'One who hoards rather than circulates. Scarcity thinking made flesh.',
		examples: ['Ebenezer Scrooge', 'Smaug', 'Gollum', 'Scrooge McDuck (early)'],
		howToUse: 'When exploring attachment. The -7D asks: what does it cost to hold too tight?'
	},

	// CLUBS - Action/Will
	{
		id: 'spark',
		name: 'The Spark',
		k: '+AC',
		type: 'character',
		description: 'Pure potential energy. The one whose action begins everything.',
		examples: ['Prometheus', 'Katniss (first arrow)', 'Rosa Parks', 'Neo (choosing the pill)'],
		howToUse: 'The inciting moment made person. The +AC shows that one action can change everything.'
	},
	{
		id: 'trickster-guide',
		name: 'The Trickster Guide',
		k: '+JC',
		type: 'character',
		description: 'Chaotic wisdom. Teaches through confusion and sideways truth. Neither fully ally nor enemy.',
		examples: ['Anansi', 'Coyote', 'The Cheshire Cat', 'Loki (myths)', 'Puck'],
		howToUse: 'When your protagonist resists learning. The +JC breaks patterns through chaos.'
	},
	{
		id: 'warrior-true',
		name: 'The True Warrior',
		k: '+NC',
		type: 'character',
		description: 'Strength in service. One who fights because they must, not because they want to.',
		examples: ['Aragorn', 'Mulan', 'Maximus', 'Katniss (late)'],
		howToUse: 'When violence must be redeemed. The +NC shows force as last resort, never first choice.'
	},
	{
		id: 'club-queen',
		name: 'The Will Queen',
		k: '+QC',
		type: 'character',
		description: 'Fierce determination in female form. Power through action, presence, unstoppable momentum.',
		examples: ['Ripley', 'Beatrix Kiddo', 'Imperator Furiosa', 'Moana'],
		howToUse: 'When will must manifest. The +QC shows that action is sometimes the only answer.'
	},
	{
		id: 'club-king',
		name: 'The Will King',
		k: '+KC',
		type: 'character',
		description: 'Mastery of action. Knows when to strike and when to wait. Energy perfectly controlled.',
		examples: ['Gandalf', 'Obi-Wan (mentor)', 'Morpheus', 'King Arthur (ideal)'],
		howToUse: 'When wisdom must act. The +KC embodies power fully integrated with purpose.'
	},
	{
		id: 'berserker',
		name: 'The Berserker',
		k: '-NC',
		type: 'character',
		description: 'Action without thought. Force that has forgotten its purpose. Destruction for its own sake.',
		examples: ['Achilles (rage)', 'The Hulk (uncontrolled)', 'Kurtz', 'Anakin (fall)'],
		howToUse: 'When power breaks its leash. The -NC shows the cost of force without wisdom.'
	},
	{
		id: 'tyrant',
		name: 'The Tyrant',
		k: '-KC',
		type: 'character',
		description: 'Will imposed without consent. Control masquerading as leadership.',
		examples: ['Sauron', 'Voldemort', 'Big Brother', 'The Emperor'],
		howToUse: 'The shadow of kingship. The -KC shows power that has forgotten service.'
	}
];

// Location Archetypes - Full Map
export const LOCATION_WELLS: Well[] = [
	// HEARTS - Emotional Spaces
	{
		id: 'hearth',
		name: 'The Hearth',
		k: '+AH',
		type: 'location',
		description: 'The original home. Where we begin, where we\'re formed. The fire that first warmed us.',
		examples: ['Bag End', 'The Dursleys\' (what Harry lacks)', 'Kansas farmhouse', 'The apartment in Up'],
		howToUse: 'Beginning of journeys. The +AH is what we carry or what we flee - but never what we forget.'
	},
	{
		id: 'sanctuary',
		name: 'The Sanctuary',
		k: '+4H',
		type: 'location',
		description: 'Safety in a dangerous world. Rest, healing, unconditional acceptance. Temporary but precious.',
		examples: ['Rivendell', 'The Burrow', 'Hogwarts (mostly)', 'The Shire'],
		howToUse: 'When your character needs restoration. The +4H shows what they\'re fighting to protect or return to.'
	},
	{
		id: 'lovers-bower',
		name: 'The Lovers\' Bower',
		k: '+10H',
		type: 'location',
		description: 'Where love is consummated or confessed. Private space made sacred by intimacy.',
		examples: ['Romeo\'s balcony', 'The Room of Requirement', 'The lake in Pride & Prejudice', 'WALL-E\'s truck'],
		howToUse: 'For pivotal romantic moments. The +10H space holds the vulnerability of true connection.'
	},
	{
		id: 'house-of-mourning',
		name: 'The House of Mourning',
		k: '-7H',
		type: 'location',
		description: 'Where grief lives. Empty chairs, stopped clocks, rooms that remember who\'s gone.',
		examples: ['Miss Havisham\'s manor', 'Bag End (post-Bilbo)', 'The Addams mansion', 'Manderley'],
		howToUse: 'When loss must be felt. The -7H space asks: what does a place become when love leaves it?'
	},

	// SPADES - Mental Spaces
	{
		id: 'library',
		name: 'The Library',
		k: '+7S',
		type: 'location',
		description: 'Where knowledge accumulates. Memory made architecture. The past preserved for future minds.',
		examples: ['Hogwarts library', 'The Library of Alexandria', 'The Unseen University', 'The Citadel'],
		howToUse: 'When answers lie in the past. The +7S space holds what others learned the hard way.'
	},
	{
		id: 'observatory',
		name: 'The Observatory',
		k: '+KS',
		type: 'location',
		description: 'Where we see furthest. Perspective gained through distance. The long view.',
		examples: ['Astronomy tower', 'The mountaintop', 'The crow\'s nest', 'Galadriel\'s mirror'],
		howToUse: 'For revelation and vision. The +KS space gives sight that changes everything.'
	},
	{
		id: 'dark-forest',
		name: 'The Dark Forest',
		k: '-7S',
		type: 'location',
		description: 'The wild unconscious. Where fear lives. Lost paths and watching eyes.',
		examples: ['Mirkwood', 'The Forbidden Forest', 'The Dark Wood (Dante)', 'Fairy tale forests'],
		howToUse: 'When facing internal demons. The -7S externalizes inner darkness - what hunts them is what they fear.'
	},
	{
		id: 'labyrinth',
		name: 'The Labyrinth',
		k: '-QS',
		type: 'location',
		description: 'The mind turned trap. Confusion made physical. Every path seems right and all are wrong.',
		examples: ['The Labyrinth (Pan\'s)', 'Escher spaces', 'The maze (The Shining)', 'Moria\'s halls'],
		howToUse: 'When lost is the point. The -QS space forces the character to find their own thread out.'
	},

	// DIAMONDS - Physical Spaces
	{
		id: 'workshop',
		name: 'The Workshop',
		k: '+7D',
		type: 'location',
		description: 'Where things become. Creation space. Sawdust and sparks and patient making.',
		examples: ['Gepetto\'s shop', 'Tony Stark\'s lab', 'Bag End\'s kitchen', 'Santa\'s workshop'],
		howToUse: 'When making matters. The +7D space shows that creation is love made tangible.'
	},
	{
		id: 'seat-of-power',
		name: 'The Seat of Power',
		k: '+KD',
		type: 'location',
		description: 'Where decisions echo. Thrones, boardrooms, war rooms. Architecture of authority.',
		examples: ['The Iron Throne', 'Gondor\'s hall', 'The Oval Office', 'Mount Olympus'],
		howToUse: 'How power shapes people. The +KD asks: does the chair change who sits, or reveal who they always were?'
	},
	{
		id: 'underworld',
		name: 'The Underworld',
		k: '-AD',
		type: 'location',
		description: 'Realm of death and transformation. The hero descends, faces deepest truth, rises changed.',
		examples: ['Hades', 'Mines of Moria', 'The Matrix machine city', 'Death Star\'s core'],
		howToUse: 'Metaphorical death and rebirth. The -AD strips everything away - only essence survives.'
	},
	{
		id: 'wasteland',
		name: 'The Wasteland',
		k: '-9D',
		type: 'location',
		description: 'Land poisoned or abandoned. What power leaves when it extracts without giving.',
		examples: ['Mordor', 'The Dead Marshes', 'Fury Road\'s desert', 'Eliot\'s wasteland'],
		howToUse: 'When showing consequences. The -9D space is the receipt for someone\'s choices.'
	},
	{
		id: 'dragons-hoard',
		name: 'The Dragon\'s Hoard',
		k: '-KD',
		type: 'location',
		description: 'Wealth hoarded past purpose. Treasure that traps its owner. Abundance become prison.',
		examples: ['Smaug\'s lair', 'Scrooge\'s vault', 'The Lonely Mountain', 'Gringotts vaults'],
		howToUse: 'When wealth corrupts. The -KD space asks: at what point does having become being had?'
	},

	// CLUBS - Action Spaces
	{
		id: 'threshold',
		name: 'The Threshold',
		k: '+3C',
		type: 'location',
		description: 'Boundary between known and unknown. Doorways, borders. Where transformation becomes possible.',
		examples: ['Platform 9¾', 'The wardrobe', 'The rabbit hole', 'The Shire\'s borders'],
		howToUse: 'When choosing to cross. The +3C says: once you pass, you cannot return unchanged.'
	},
	{
		id: 'arena',
		name: 'The Arena',
		k: '+5C',
		type: 'location',
		description: 'Where conflict is formalized. The test made public. No escape but through.',
		examples: ['The Hunger Games arena', 'The Colosseum', 'The duel ground', 'The courtroom'],
		howToUse: 'For confrontations that can\'t be avoided. The +5C space forces truth through combat.'
	},
	{
		id: 'crossroads',
		name: 'The Crossroads',
		k: '+7C',
		type: 'location',
		description: 'Where paths diverge. Decision point. The moment before choice crystallizes.',
		examples: ['Robert Frost\'s fork', 'The red pill/blue pill room', 'Hercules\' choice', 'The sorting'],
		howToUse: 'For irreversible decisions. The +7C space makes choice visible and permanent.'
	},
	{
		id: 'summit',
		name: 'The Summit',
		k: '+KC',
		type: 'location',
		description: 'The highest point. Where the journey ends or transforms. Nowhere left to climb.',
		examples: ['Mount Doom', 'The peak in myth', 'The final level', 'Everest'],
		howToUse: 'For climax. The +KC space is where everything you\'ve gathered gets spent.'
	},
	{
		id: 'battlefield',
		name: 'The Battlefield',
		k: '-NC',
		type: 'location',
		description: 'Where destruction happens. Chaos in motion. Strategy dissolved into survival.',
		examples: ['Helm\'s Deep', 'The Somme', 'The Battle of Hogwarts', 'Troy\'s fields'],
		howToUse: 'When violence can\'t be avoided. The -NC space shows the cost of conflict on everyone.'
	},
	{
		id: 'prison',
		name: 'The Prison',
		k: '-9C',
		type: 'location',
		description: 'Where freedom ends. Walls that close in. The space that tells you no.',
		examples: ['Azkaban', 'Shawshank', 'The Matrix (realized)', 'The belly of the whale'],
		howToUse: 'When escape is the plot. The -9C space makes freedom\'s value visible by its absence.'
	}
];

// Story Structure Patterns
export const STRUCTURE_WELLS: Well[] = [
	{
		id: 'descent-return',
		name: 'Descent and Return',
		k: '+QC',
		type: 'structure',
		description: 'The hero goes down into darkness and brings something back. The fundamental mythic pattern.',
		examples: ['Orpheus', 'The Lord of the Rings', 'The Matrix', 'Finding Nemo'],
		howToUse: 'When your story needs mythic weight. What does your character descend to find? What do they bring back? What do they lose?'
	},
	{
		id: 'trickster-gambit',
		name: 'The Trickster\'s Gambit',
		k: '+JC',
		type: 'structure',
		description: 'Chaos creates opportunity. The plan that shouldn\'t work, works precisely because it\'s absurd.',
		examples: ['Anansi stories', 'Ocean\'s Eleven', 'The Sting', 'Loki myths'],
		howToUse: 'When your protagonist is outmatched in direct confrontation. The +JC structure says: change the game instead of playing it.'
	},
	{
		id: 'loves-arithmetic',
		name: 'Love\'s Arithmetic',
		k: '+10H',
		type: 'structure',
		description: 'The mathematics of the heart. Who loves whom, and what that costs. Triangles, sacrifices, reunions.',
		examples: ['Pride and Prejudice', 'Casablanca', 'Romeo and Juliet', 'The Princess Bride'],
		howToUse: 'When the emotional core is relationship. The +10H structure asks: what would you give up for love? What wouldn\'t you?'
	}
];

// Get all wells
export function getAllWells(): Well[] {
	return [...CHARACTER_WELLS, ...LOCATION_WELLS, ...STRUCTURE_WELLS];
}

// Find wells by K-coordinate
export function getWellByK(k: string): Well | undefined {
	return getAllWells().find(w => w.k === k);
}

// Find wells by type
export function getWellsByType(type: Well['type']): Well[] {
	return getAllWells().filter(w => w.type === type);
}

// Search wells by keyword
export function searchWells(query: string): Well[] {
	const q = query.toLowerCase();
	return getAllWells().filter(w =>
		w.name.toLowerCase().includes(q) ||
		w.description.toLowerCase().includes(q) ||
		w.examples.some(e => e.toLowerCase().includes(q))
	);
}

// Format well for display
export function formatWell(well: Well): string {
	return `**${well.name}** (${well.k})
${well.description}

*Examples:* ${well.examples.join(', ')}

*How to use:* ${well.howToUse}`;
}
