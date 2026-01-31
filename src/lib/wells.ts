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

// Character Archetypes
export const CHARACTER_WELLS: Well[] = [
	{
		id: 'hopeful-journeyer',
		name: 'The Hopeful Journeyer',
		k: '+7H',
		type: 'character',
		description: 'One who sets out with heart open, believing the world can be better. Naive but not foolish - their hope is a choice.',
		examples: ['Frodo Baggins', 'Dorothy Gale', 'Luke Skywalker (early)', 'Bilbo Baggins'],
		howToUse: 'When your protagonist needs to carry light into darkness. The +7H character doesn\'t ignore danger - they walk toward it anyway because someone must.'
	},
	{
		id: 'scheming-power',
		name: 'The Scheming Power',
		k: '-QS',
		type: 'character',
		description: 'Intelligence weaponized for control. Sees people as pieces on a board. Often charming on the surface.',
		examples: ['Iago', 'Lady Macbeth', 'Cersei Lannister', 'Scar'],
		howToUse: 'When you need an antagonist who destroys through manipulation rather than force. The -QS character makes the protagonist doubt themselves.'
	},
	{
		id: 'trickster-guide',
		name: 'The Trickster Guide',
		k: '+JC',
		type: 'character',
		description: 'Chaotic wisdom. Teaches through confusion, pranks, and sideways truth. Neither fully ally nor enemy.',
		examples: ['Anansi', 'Coyote', 'The Cheshire Cat', 'Loki (myths)', 'Puck'],
		howToUse: 'When your protagonist needs to learn something they\'re resisting. The +JC character breaks patterns and opens new paths through chaos.'
	},
	{
		id: 'wounded-healer',
		name: 'The Wounded Healer',
		k: '+6H',
		type: 'character',
		description: 'One who transforms their own pain into medicine for others. Empathy born from suffering.',
		examples: ['Chiron', 'Samwise Gamgee', 'Hagrid', 'Doc Holliday (Tombstone)'],
		howToUse: 'When your story needs someone who can hold space for pain without flinching. The +6H character knows darkness and chooses light anyway.'
	},
	{
		id: 'fallen-king',
		name: 'The Fallen King',
		k: '-KD',
		type: 'character',
		description: 'Power corrupted or lost. Once great, now diminished by their own choices or fate\'s cruelty.',
		examples: ['King Lear', 'Ozymandias', 'Théoden (under Wormtongue)', 'Walter White'],
		howToUse: 'When exploring how power fails. The -KD character shows what happens when the crown becomes heavier than the head.'
	},
	{
		id: 'truth-speaker',
		name: 'The Truth Speaker',
		k: '+AS',
		type: 'character',
		description: 'The one who says what no one wants to hear. Often marginalized or dismissed until proven right.',
		examples: ['Cassandra', 'The Fool (King Lear)', 'Tiresias', 'Luna Lovegood'],
		howToUse: 'When your story needs uncomfortable truths delivered. The +AS character sees clearly but isn\'t believed - until it\'s too late.'
	},
	{
		id: 'gentle-monster',
		name: 'The Gentle Monster',
		k: '+5D',
		type: 'character',
		description: 'Feared for appearance, kind in essence. Teaches that surfaces lie. Often isolated by others\' fear.',
		examples: ['Frankenstein\'s Monster', 'The Beast (Beauty and)', 'Hagrid', 'The Iron Giant'],
		howToUse: 'When exploring prejudice and true nature. The +5D character asks: what makes someone monstrous - form or action?'
	},
	{
		id: 'loyal-shadow',
		name: 'The Loyal Shadow',
		k: '+9H',
		type: 'character',
		description: 'The one who stays. Not the hero, but the hero\'s anchor. Their loyalty is the story\'s emotional core.',
		examples: ['Samwise Gamgee', 'Dr. Watson', 'Ron Weasley', 'Horatio'],
		howToUse: 'When your protagonist needs grounding. The +9H character reminds us that love is shown through presence, not grand gestures.'
	}
];

// Location Archetypes
export const LOCATION_WELLS: Well[] = [
	{
		id: 'threshold',
		name: 'The Threshold',
		k: '+3C',
		type: 'location',
		description: 'The boundary between known and unknown. Doorways, borders, shores. Where transformation becomes possible.',
		examples: ['Platform 9¾', 'The wardrobe to Narnia', 'The rabbit hole', 'The Shire\'s borders'],
		howToUse: 'When your character must choose to cross into the unknown. The +3C space says: once you pass, you cannot return unchanged.'
	},
	{
		id: 'dark-forest',
		name: 'The Dark Forest',
		k: '-7S',
		type: 'location',
		description: 'The wild unconscious. Where fear lives. Lost paths and watching eyes. The hero must pass through alone.',
		examples: ['Mirkwood', 'The Forbidden Forest', 'The Dark Wood (Dante)', 'The forest in fairy tales'],
		howToUse: 'When your character must face internal demons. The -7S space externalizes inner darkness - what hunts them there is what they fear in themselves.'
	},
	{
		id: 'seat-of-power',
		name: 'The Seat of Power',
		k: '+KD',
		type: 'location',
		description: 'Where decisions echo. Thrones, boardrooms, war rooms. The architecture of authority.',
		examples: ['The Iron Throne', 'Gondor\'s throne room', 'The Oval Office', 'Mount Olympus'],
		howToUse: 'When exploring how power shapes people. The +KD space asks: does the chair change who sits in it, or reveal who they always were?'
	},
	{
		id: 'sanctuary',
		name: 'The Sanctuary',
		k: '+4H',
		type: 'location',
		description: 'Safety in a dangerous world. The place of rest and healing. Often temporary, always precious.',
		examples: ['Rivendell', 'The Burrow', 'Hogwarts (mostly)', 'The Shire'],
		howToUse: 'When your character needs restoration before the final push. The +4H space shows what they\'re fighting to protect or return to.'
	},
	{
		id: 'underworld',
		name: 'The Underworld',
		k: '-AD',
		type: 'location',
		description: 'The realm of death, secrets, and transformation. The hero descends, faces the deepest truth, and rises changed.',
		examples: ['Hades', 'The Mines of Moria', 'The Matrix\'s machine city', 'The Death Star\'s core'],
		howToUse: 'When your character must die metaphorically to be reborn. The -AD space strips everything away - only essence survives.'
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
