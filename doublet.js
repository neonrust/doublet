'use strict';

var block_colors = {
	  1: '#777',
	  2: '#9af',
	  4: '#7b6',
	  8: '#e95',
	 16: '#db9',
 	 32: '#3cc',
	 64: '#bb6',
	128: '#88c',
	256: '#4a5',
	512: '#c73',
};
var block_suffixes = [ '', 'k', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y' ];
var block_styles = {
	'': c => 'background: ' + c + ';',
	'k': c => 'background: ' + c + '; border-left-style: solid; border-right-style: solid;',
	'M': c => 'background: ' + c + '; border-style: solid; line-height: 3.4rem;',
	'G': c => 'background: linear-gradient(90deg, ' + c + ', ' + c + ', ' + c + ', white);',
	'T': c => 'background: linear-gradient(90deg, ' + c + ', ' + c + ', ' + c + ', white); border-left-style: solid; border-right-style: solid;',
	'P': c => 'background: linear-gradient(90deg, ' + c + ', ' + c + ', ' + c + ', white); border-style: solid; line-height: 3.4rem;',
	'E': c => 'background: linear-gradient(45deg, white, ' + c + ', ' + c + ', white);',
	'Z': c => 'background: linear-gradient(45deg, white, ' + c + ', ' + c + ', white); border-left-style: solid; border-right-style: solid;',
	'Y': c => 'background: linear-gradient(45deg, white, ' + c + ', ' + c + ', white); border-style: solid; line-height: 3.4rem;',
};
const suffix_values = {
	'': 1,
	'k': 10,
	'M': 20,
	'G': 30,
	'T': 40,
	'P': 50,
	'E': 60,
	'Z': 70,
	'Y': 80,
};
console.assert(block_suffixes.length === Object.keys(block_styles).length, block_suffixes, block_styles);
console.assert(block_suffixes.length === Object.keys(suffix_values).length, block_suffixes, suffix_values);

var block_name_ptn = new RegExp('^(1|2|4|8|16|32|64|128|256|512)([' + block_suffixes.join('') + ']?)$');


const game_config = JSON.parse(localStorage.getItem('config') || '{}');
game_config.num_lanes = game_config.num_lanes || 5;
game_config.lane_blocks = game_config.lane_blocks || 10;
let lane_elements = [];

let game_mode = 'MENU';

high_score.innerHTML = localStorage.getItem('high-score') || 0;


function get_css_property(name)
{
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
function set_css_property(name, value)
{
	document.documentElement.style.setProperty(name, value);
}

function create_block_style(name)
{
	const m = block_name_ptn.exec(name);
	const num = m[1];
	const suffix = m[2];

	let style_elem = null;
	const style_elems = document.getElementsByTagName('style');
	if(style_elems && style_elems.length > 0)
		style_elem = style_elems[0];
	else
	{
		style_elem = document.createElement('style');
		style_elem.type = 'text/css';
		document.head.appendChild(style_elem);
	}
	const add_css = (selector, styles) => {
		style_elem.innerHTML = style_elem.innerHTML + selector + ' { ' + styles + ' }\n';
	};

	const color = block_colors[num];
	const style = block_styles[suffix](color);

	add_css('.block_' + name, style);
	add_css('.block_' + name + ':after', 'content: "' + name + '";');
}

function setup_lanes()
{
	const num_lanes = game_config.num_lanes || 5;

	lane_elements = [];
	for(let idx = 0; idx < num_lanes; idx++)
	{
		let lane = document.createElement('span');
		add_classes(lane, ['lane']);
		lane.id = 'lane_' + idx;

		lane_elements.push(lane);
		lane_container.appendChild(lane);
	}

	set_css_property('--lane-blocks', game_config.lane_blocks || 10);
}

// needs to be called whenever game (board) configuration changes
setup_lanes();

function add_classes(element, classes)
{
	const existing_classes = element.className.trim().split(/[ \t\n\v\r\f]+/);
	let exist_check = new Set(existing_classes);
	let merged = Array.from(existing_classes);
	const L = classes.length;
	for(let idx = 0; idx < L; idx++)
	{
		let cls = classes[idx];
		if(! exist_check.has(cls))
			merged.push(cls);
	}
	element.className = merged.join(' ');
}

function parse_block_name(name)
{
	if(! name)
		return null;
	var m = block_name_ptn.exec(name);
	if(! m)
		return null;

	const num = parseInt(m[1]);
	const suffix = m[2];

	return {
		num: num,
		suffix: suffix,
		value: suffix_values[suffix]
	};
}

function next_block_name(name)
{
	let info = parse_block_name(name, {fail: true});
	if(! info)
		info = { num: 1, suffix: '', value: 1 };

	let num = info.num << 1;  // next power-of-2
	let suffix = info.suffix;

	if(num > 512) // end of numeric range
	{
		// start new range
		num = 1;
		// next suffix
		var suffix_idx = block_suffixes.indexOf(suffix);
		if(suffix_idx == block_suffixes.length - 1) // already last suffix
			return null;
		suffix = block_suffixes[suffix_idx + 1];
	}

	return num + suffix;
}

function clear_game()
{
	for(let lane of lane_elements)
		lane.innerHTML = '';

	score.innerHTML = '0';

	play_container.innerHTML = '';
	current_block = null;
	next_current_block = null;

	save_game_state();
}

function add_score(points)
{
	const current = parseInt(score.innerHTML);
	const new_score = current + points
	score.innerHTML = new_score;

	const high = parseInt(high_score.innerHTML);

	if(new_score > high)
		high_score.innerHTML = new_score;
}

function game_over()
{
	game_mode = 'GAME-OVER';
	on_game_mode_changed();
}

function show_menu()
{
	setTimeout(_ => {
		alert('Click OK to play!');

		game_mode = 'PLAYING';
		on_game_mode_changed();
	}, 500);
}

function show_game_over()
{
	clear_play_block();
	remove_event_handlers();
	save_game_state();

	let message = 'This game is over!\n\nScore: ' + score.innerHTML;

	if(score.innerHTML === high_score.innerHTML && parseInt(score.innerHTML) > 0)
		message += '\n\nYou set a new high score!';

	alert(message);

	game_mode = 'MENU';
	on_game_mode_changed();
}

let save_timer = null;

function save_game_state()
{
	if(game_mode !== 'PLAYING')
	{
		localStorage.setItem('game-state', 'null');
		return;
	}

	localStorage.setItem('high-score', high_score.innerHTML);

	if(save_timer !== null)
		clearTimeout(save_timer);

	save_timer = setTimeout(_ => {
		const state = {
			score: parseInt(score.innerHTML),
			lanes: {},
			next_blocks: [],
		};

		for(let lane of lane_elements)
		{
			const lane_num = parseInt(lane.id.substring(5));
			state.lanes[lane_num] = [];
			for(var block of lane.children)
				state.lanes[lane_num].push(block_name(block));
		}

		let value = JSON.stringify(state);
		// TODO: compress, encrypt, overkill?
		localStorage.setItem('game-state', value);
	}, 1000);
}

function merge_blocks(lane)
{
	console.log('TODO: MERGE!');

	const merged = [];

	// TODO: start try-to-merge at the top of lane 'lane'
	//   i.e. check above, left and right neighbors
	//   this is also recursive


	return merged;
}

function block_value(name)
{
	const info = parse_block_name(name);

	return info.num * info.value;
}

function can_play()
{
	// any non-full lanes?
	for(let lane of lane_elements)
		if(lane.children.length < game_config.lane_blocks)
			return true;

	// if any of the "top" blocks are the same, we can place there
	for(let lane of lane_elements)
	{
		const top_block = lane.children[lane.children.length - 1];
		if(current_block == block_name(top_block))
		   return true;
	}
	return false;
}

function create_block_element(name)
{
	const block = document.createElement('span');
	add_classes(block, [ 'block block_' + name ]);
	// block.setAttribute('block-name', name);
	// block.setAttribute('title', name);

	return block;
}

function block_name(element)
{
	let classes = element.className.split(/[ \t\n\v\r\f]+/);
	for(let cls of classes)
	{
		if(cls.startsWith('block_'))
		{
			const name = cls.substring(6);
			const info = parse_block_name(name, {fail: true});
			if(info && info.num >= 1)
				return info.num + info.suffix;
		}
	}
	return null;
}

function compute_score(merged)
{
	// return points scored
	//   points are derived from merged blocks, e.g.:
	//     2 - 512 = 1 point
	//     1k = 10 points
	//     1M = 20 points
	//   i.e. log2 of the block value
	let points = 0;

	for(let block of merged)
		points += block_value(block);

	return points;
}

function add_block(num, block_name)
{
	const lane = lane_elements[num];

	if(lane.children.length === game_config.lane_blocks) // already full
	{
		game_over();
		return false;
	}

	const block = create_block_element(block_name);

	lane.append(block);

	const merged = merge_blocks(num);
	add_score(compute_score(merged) + block_value(block_name));
	choose_next_block();
	if(! can_play())
	{
		game_over();
		return false;
	}
	save_game_state();

	return true;
}

for(let block_name = next_block_name(''); block_name != null; block_name = next_block_name(block_name))
	create_block_style(block_name);

let current_block = null;
let next_current_block = null;
let current_block_hover = null;

function choose_next_block()
{
	// TODO: randomize next block (set 'current_block')
	//   based on the existing blocks on the board

	if(next_current_block === null)
		current_block = '2'; // always start with '2'
	else
		current_block = next_current_block;

	next_current_block = choose_play_block();

	play_container.innerHTML = '';

	let curr_element = create_block_element(current_block);
	add_classes(curr_element, 'current-block');
	let next_element = create_block_element(next_current_block);
	add_classes(next_element, [ 'small', 'next-block' ]);

	play_container.appendChild(curr_element);
	play_container.appendChild(next_element);
}

const minimum_blocks = [2, 4, 8];

function choose_play_block()
{
	let highest_block = '2';
	let highest_value = 0;

	for(let lane of lane_elements)
	{
		for(let block_elem of lane.children)
		{
			const name = block_name(block_elem);
			const value = block_value(name);
			if(value > highest_value)
			{
				highest_value = value;
				highest_block = name;
			}
		}
	}

	// TODO: if the highest is "very low", the next higher up is also ok
	//   "very low" might be something like 8 or maybe 16.
	console.log('highest_value:', highest_value);

	if(highest_value <= minimum_blocks[minimum_blocks.length - 1])
		return minimum_blocks[Math.floor(Math.random()*minimum_blocks.length)];

	return highest_block;
}

function clear_play_block()
{
	current_block_hover.remove();
	current_block_hover = null;
}

function lane_hover(num, entered)
{
	if(! entered && current_block_hover)
	{
		// console.log('lane_hover:', num, 'removing hover block');
		clear_play_block();
	}
	else if(entered && !current_block_hover)
	{
		// console.log('lane_hover:', num, 'creating hover block');
		current_block_hover = create_block_element(current_block);
		add_classes(current_block_hover, ['small', 'block-pending']);
		// current_block_hover.style = 'opacity: 0';
		// current_block_hover.style = 'opacity: 1';
		// console.log('current_block_hover:', current_block_hover.style);

		document.body.appendChild(current_block_hover);
		current_block_hover.style = 'left: calc(50% - (5*(var(--block-size) + 0.4rem))/2 + ' + num + '*(var(--block-size) + 0.4rem) + 0.6rem);';
	}
}

function lane_click(num)
{
	lane_hover(num, false);
	let result = add_block(num, current_block);
	if(result)
		lane_hover(num, true);
	return result;
}

let event_controller = null;

function add_event_handlers()
{
	event_controller = new AbortController();
	const opts = { signal: event_controller.signal };

	for(var idx = 0; idx < lane_elements.length; idx++)
	{
		const lane_idx = idx;
		lane_elements[idx].addEventListener('mouseenter',  _ => {
			return lane_hover(lane_idx, true);
		}, opts);
		lane_elements[idx].addEventListener('mouseleave',  _ => {
			return lane_hover(lane_idx, false);
		}, opts);
		lane_elements[idx].addEventListener('click',  _ => {
			return lane_click(lane_idx);
		}, opts);
	}
}

function remove_event_handlers()
{
	event_controller.abort();
	event_controller = null;
}

function init_game()
{
	clear_game();
	choose_next_block();

	save_game_state();
	add_event_handlers();
}


function on_game_mode_changed()
{
	switch(game_mode)
	{
		case 'PLAYING':
		{
			init_game();
			break;
		}
		case 'GAME-OVER':
		{
			show_game_over();
			break;
		}
		case 'MENU':
		{
			show_menu();
			break;
		}
	}
}



// TESTING TESTING ===========================
game_mode = 'PLAYING';
// TESTING TESTING ===========================

on_game_mode_changed();
