'use strict';

const lane_elements = [ lane_0, lane_1, lane_2, lane_3, lane_4 ];
const lane_length = 10;

var high_score = 0;

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
	'X': 70,
	'Y': 80,
};
console.assert(block_suffixes.length === Object.keys(block_styles).length, block_suffixes, block_styles);
console.assert(block_suffixes.length === Object.keys(suffix_values).length, block_suffixes, suffix_values);

var block_name_ptn = new RegExp('^(1|2|4|8|16|32|64|128|256|512)([' + block_suffixes.join('') + ']?)$');


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
	const add_css = text => style_elem.innerHTML = style_elem.innerHTML + text + '\n';

	const color = block_colors[num];
	const style = block_styles[suffix](color);

	add_css('.block_' + name + ' { ' + style + ' }');
	add_css('.block_' + name + ':after { content: "' + name + '"; }');
}

function add_class(element, classes)
{
	classes = classes.split(/[ \t\n\v\r\f]+/);
	const existing_classes = element.className.split(/[ \t\n\v\r\f]+/);
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
		return { num: 2, suffix: '', value: 1 };
	var m = block_name_ptn.exec(name);
	if(! m)
		return { num: 2, suffix: '', value: 1 };

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
	const info = parse_block_name(name);

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

	// TODO: clear saved game state (local storage)
}

function add_score(points)
{
	let current = parseInt(score.innerHTML);
	score.innerHTML = current + points;
}

function game_over()
{
	alert('This game is over!');
	clear_game();
}

function save_game_state()
{
	// TODO: write game state to local storage
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
		if(lane.children.length < lane_length)
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
	add_class(block, 'block block_' + name);
	block.setAttribute('block-name', name);
	block.setAttribute('title', name);

	return block;
}

function block_name(element)
{
	return element.getAttribute('block-name');
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

	if(lane.children.length === lane_length) // already full
	{
		game_over();
		return false;
	}

	const block = create_block_element(block_name);

	lane.append(block);

	const merged = merge_blocks(num);
	add_score(compute_points(merged));
	next_block();
	if(! can_play())
	{
		game_over();
		return false;
	}
	save_game_state();

	return true;
}

var block_name = '';
while(true)
{
	block_name = next_block_name(block_name);
	if(block_name === null)
		break;
	create_block_style(block_name);
}

let current_block = '2';
let current_block_hover = null;

function next_block()
{
	// TODO: randomize next block (set 'current_block')
	//   based on the existing blocks on the board
}

function lane_hover(num, entered)
{
	if(! entered && current_block_hover)
	{
		console.log('lane_hover:', num, 'removing hover block');
		current_block_hover.remove();
		current_block_hover = null;
	}
	else if(entered && !current_block_hover)
	{
		console.log('lane_hover:', num, 'creating hover block');
		current_block_hover = create_block_element(current_block);
		add_class(current_block_hover, 'small block-pending');
		current_block_hover.style = 'opacity: 0';
		// current_block_hover.style = 'opacity: 1';
		console.log('current_block_hover:', current_block_hover.style);

		document.body.appendChild(current_block_hover);
		current_block_hover.style = 'left: calc(50% - (5*(var(--block-size) + 0.4rem))/2 + ' + num + '*(var(--block-size) + 0.4rem) + 0.6rem);';
	}
}

function lane_click(num)
{
	return add_block(num, current_block);
}

for(var idx = 0; idx < lane_elements.length; idx++)
{
	const lane_idx = idx;
	lane_elements[idx].addEventListener('mouseenter',  _ => {
		return lane_hover(lane_idx, true);
	});
	lane_elements[idx].addEventListener('mouseleave',  _ => {
		return lane_hover(lane_idx, false);
	});
	lane_elements[idx].addEventListener('click',  _ => {
		return lane_click(lane_idx);
	});
}
