

/* =================== CONSTANTS ========================== */
// var TILE_EVAL_BASE = 3; // these two values are used as coeficient for the number of tiles. the more tiles there are, the greater the coeficient
// var TILE_EVAL_COEF = 0.5; // so that the algorithm would choose the path that minimises the number of tiles
// var LR_STRATEGY_COEF = 2; // the coeficinet for choosing a move in the set (right, up, down) so that all values remain in a corners
// var UP_COEF = 15;
// var RIGHT_COEF = 5;
// var DOWN_COEF = 1;
// var LEFT_COEF = 0.5;
// var RESET_NUMBER = 3;

// keep these values between 0 and 1 for the coeficients that represent bad behaviour
var CORNER_TILE_COEF_BAD = 0.1;
var DIRECTION_LEFT_COEF = 0.8;
var HIGH_NUMBERS_DONT_STICK_TOGETHER = 0.5;

// keep these values over 1 for the coeficients that represnt good behaviour
var CORNER_TILE_COEF_GOOD = 1.40;
var HIGH_NUMBERS_STICK_TOGETHER = 1.1;

// how many times large than the current fit must the new fit be to drop the old one
var FIT_MAGNITUDE = 1.3;

/*

Create all graph, find best path with the two evaluation functions; holdd that path until a best one is found.
Problems: will a better one arrive? If the current one stays for long, tiles will gather and the new path should be focused more on clearing the tiles.

*/

function fireKey(el)
{
    var key;
    switch(el)
    {
        case "left":
        key = 37;
        break;
        case "right":
        key = 39;
        break;  
        case "up":
        key = 38;
        break;
        case "down":
        key = 40;  
    }
 
    if(document.createEventObject) {
        var eventObj = document.createEventObject();
        eventObj.keyCode = key;
        el.fireEvent("onkeydown", eventObj);  
    } else if(document.createEvent) {
        var eventObj = document.createEvent("Events");
        eventObj.initEvent("keydown", true, true);
        eventObj.which = key;
        document.body.dispatchEvent(eventObj);
    }
}

function get_tile(x, y) {
	var xpath_tile_new ="/html/body/div[@class='container']/div[@class='game-container']"
		 				   + "/div[@class='tile-container']/div[contains(@class,'tile-position-" + x.toString() + "-" + y.toString() + " tile-new')]"
		 				   + "/div[@class='tile-inner']/text()";

	var xpath_tile_merged ="/html/body/div[@class='container']/div[@class='game-container']"
		 				   + "/div[@class='tile-container']/div[contains(@class,'tile-position-" + x.toString() + "-" + y.toString() + " tile-merged')]"
		 				   + "/div[@class='tile-inner']/text()";	

	var xpath_basic ="/html/body/div[@class='container']/div[@class='game-container']"
		 				   + "/div[@class='tile-container']/div[contains(@class,'tile-position-" + x.toString() + "-" + y.toString() + "')]"
		 				   + "/div[@class='tile-inner']/text()";
	var res;
	if((res = document.evaluate(xpath_tile_merged, document, null, XPathResult.ANY_TYPE, null).iterateNext()) != null) {
		return parseInt(res.data);
	}

	if((res = document.evaluate(xpath_tile_new, document, null, XPathResult.ANY_TYPE, null).iterateNext()) != null) {
		return parseInt(res.data);
	}

	if((res = document.evaluate(xpath_basic, document, null, XPathResult.ANY_TYPE, null).iterateNext()) != null) {
		return parseInt(res.data);
	}

	return null;
}

function get_tiles_template() {
	var game = {};
	for (i = 0; i <= 5; i++) {
		game[i] = {}
		for (j = 0; j <= 5; j++) {
			game[i][j] = null;
		}
	}
	game.direction = "new";
	return game;
}

function get_tiles() {
	game = get_tiles_template();
	for (i = 1; i <= 4; i++) {
		for (j = 1; j <= 4; j++) {
			game[j][i] = get_tile(i, j);
		}
	}
	return game;
}

function stack(direction, tiles) {
	new_tile = get_tiles_template()
	var curr_pos;
	switch(direction) {
		case "down": {
			// for each column
			for(column = 1; column <= 4; column++) {
				curr_row = 4;
				// for each row, upwards
				for(row = 4; row > 0; row--) {
					if(tiles[row][column] != null) {
						new_tile[curr_row][column] = tiles[row][column];
						curr_row --;
					}
				}
			}
			break;
		}
		case "up": {
			// for each column
			for(column = 1; column <= 4; column++) {
				curr_row = 1;
				// for each row, downwards
				for(row = 1; row <= 4; row++) {
					if(tiles[row][column] != null) {
						new_tile[curr_row][column] = tiles[row][column];
						curr_row ++;
					}
				}
			}
			break;
		}
		case "left": {
			// for each row
			for(row = 1; row <= 4; row++) {
				curr_column = 1;
				// for each column, from right to left
				for(column = 1; column <= 4; column++) {
					if(tiles[row][column] != null) {
						new_tile[row][curr_column] = tiles[row][column];
						curr_column ++;
					} 
				}
			}
			break;
		}
		case "right": {
			// for each row
			for(row = 1; row <= 4; row++) {
				curr_column = 4;
				// for each column, from right to left
				for(column = 4; column > 0; column--) {
					if(tiles[row][column] != null) {
						new_tile[row][curr_column] = tiles[row][column];
						curr_column --;
					}
				}
			}
			break;
		}

	}
	return new_tile
}

function merge(direction, tiles, cmp) {
	if(!direction || !tiles) {
		console.error("direction or tiles came wrong");
		return null;
	}
	cmp = cmp || false;
	var new_tile = get_tiles_template()
	switch(direction) {
		case "down": {
			for(var column = 1; column <= 4; column ++) {
				var curr_row = 4
				for(row = 4; row >= 1; row --) {
					if(tiles[row][column] == null) {
						continue;
					}

					var ahead_row = row - 1;
					while(ahead_row > 1 && tiles[ahead_row][column] == null) {
						ahead_row --;
					}

					if(tiles[row][column] == tiles[ahead_row][column]) {
						new_tile[curr_row][column] = 2 * tiles[row][column];
						row = ahead_row;
					} else {
						new_tile[curr_row][column] = tiles[row][column];
					}

					curr_row --;
				}
			}
			new_tile.direction = "down";
			break;
		}
		case "up": {
			for(var column = 1; column <= 4; column ++) {
				var curr_row = 1
				for(var row = 1; row <= 4; row ++) {
					if(tiles[row][column] == null) {
						continue;
					}

					var ahead_row = row + 1;
					while(ahead_row < 4 && tiles[ahead_row][column] == null) {
						ahead_row ++;
					}

					if(tiles[row][column] == tiles[ahead_row][column]) {
						new_tile[curr_row][column] = 2 * tiles[row][column];
						row = ahead_row;
					} else {
						new_tile[curr_row][column] = tiles[row][column];
					}

					curr_row ++;
				}
			}
			new_tile.direction = "up";
			break;
		}
		case "left": {
			for(var row = 1; row <= 4; row ++) {
				curr_col = 1
				for(var column = 1; column <= 4; column ++) {
					if(tiles[row][column] == null) {
						continue;
					}

					var ahead_col = column + 1;
					while(ahead_col < 4 && tiles[row][ahead_col] == null) {
						ahead_col ++;
					}

					if(tiles[row][column] == tiles[row][ahead_col]) {
						new_tile[row][curr_col] = 2 * tiles[row][column];
						column = ahead_col;
					} else {
						new_tile[row][curr_col] = tiles[row][column];
					}

					curr_col ++;
				}
			}
			new_tile.direction = "left";
			break;
		}

		// if there is only one value on right, and you move it to the left it moves the value to the left but the other value remains
		case "right": {
			for(var row = 1; row <= 4; row ++) {
				var curr_col = 4
				for(var column = 4; column >= 1; column --) {
					if(tiles[row][column] == null) {
						continue;
					}

					var ahead_col = column - 1;
					while(ahead_col > 1 && tiles[row][ahead_col] == null) {
						ahead_col --;
					}

					if(tiles[row][column] == tiles[row][ahead_col]) {
						new_tile[row][curr_col] = 2 * tiles[row][column];
						column = ahead_col;
					} else {
						new_tile[row][curr_col] = tiles[row][column];
					}

					curr_col --;
				}
			}
		}
		new_tile.direction = "right";
		break;
	}

	// return null if the new tile is identical with the old one tile-wise or eval-wise
	if(compare(tiles, new_tile) ) { // || eval(tiles) == eval(new_tile)
		return null;
	}

	return new_tile;
}


function eval(tiles) {
	if(tiles == null) {
		return 0;
	}
	function get_tile_obj() {
		var obj = new Object();
		obj.x = 0;
		obj.y = 0;
		obj.value = 0;

		return obj;
	}

	var no_tiles = 0;
	var max = get_tile_obj();
	var sum = 0;
	for(row = 1; row <= 4; row ++) {
		for(column = 1; column <= 4; column ++) {
			if((val = tiles[row][column]) != null) {
				sum += val * val / 2048;
				no_tiles++;

				// for corner high tile
				if(max.value < tiles[row][column]) {
					max.value = tiles[row][column];
					max.x = row;
					max.y = column;
				}
			}
		}
	}
	console.info("initial sum: " + sum.toString());

	// if the  highest number tile is not in the corner, apply CORNER_TILE_COEF_BAD
	if( ! (max.x == 1 && max.y == 4 || max.x == 4 && max.y == 4)) {
		sum =  sum * CORNER_TILE_COEF_BAD;
		console.info("CORNER_TILE_COEF_BAD sum" + sum.toString());
		// the more tiles there are on the board, the more discouraged is for the biggest tile to leave the corner
		if(7 - no_tiles < 0) {
			sum = sum * 1 / (7 - no_tiles) * -1;
			console.info("there are more than seven tiles sum "  + sum.toString());
		}
	} else {
		sum = sum * CORNER_TILE_COEF_GOOD;
		console.info("CORNER_TILE_COEF_GOOD sum: " + sum.toString());
	}

	// eval based on other numbers, high numbers that should be close to the highest number
	var sec_max = get_tile_obj();
	var maxs = [max.value];
	var k = 3;

	while(k) {
		var ok = false;
		for(row = 1; row <= 4; row ++) {
			for(column = 1; column <= 4; column ++) {
				if(tiles[row][column] != null && sec_max.value < tiles[row][column] && maxs.indexOf(tiles[row][column]) == -1 && tiles[row][column] >= 32) {
					sec_max.value = tiles[row][column];
					sec_max.x = row;
					sec_max.y = column;
					ok = true;
				} else if(tiles[row][column] != null && sec_max.value == tiles[row][column] && 
						Math.abs(max.x - row) == 1 && Math.abs(max.y - column) == 0 || Math.abs(max.x - row) == 0 && Math.abs(max.y - column) == 1) {
					sec_max.x = row;
					sec_max.y = column;
				}
			}
		}
		if(!ok) {
			break;
		}

		if(Math.abs(max.x - sec_max.x) == 1 && Math.abs(max.y - sec_max.y) == 0 || Math.abs(max.x - sec_max.x) == 0 && Math.abs(max.y - sec_max.y) == 1) {
			// did the last part [((...))] because when small numbers are next to big nubers (e.g. 32 neat 512) it is not that relevant
			sum = sum * HIGH_NUMBERS_STICK_TOGETHER * ((max.value / sec_max.value) / 70 + 1);
			console.info("multiplied for HIGH_NUMBERS_STICK_TOGETHER with max: " + max.value.toString() + " and sec_max: " + sec_max.value.toString() + " sum: " + sum.toString());
		} else {
			sum = sum * HIGH_NUMBERS_DONT_STICK_TOGETHER;
			console.info("multiplied for HIGH_NUMBERS_DONT_STICK_TOGETHER with max: " + max.value.toString() + " and sec_max: " + sec_max.value.toString() + " sum: " + sum.toString());
			break;
		}

		maxs.push(sec_max.value);
		max = sec_max;
		sec_max = get_tile_obj();
		k--;
	}

	// so that left would not be encouraged
	if(tiles.direction == "left") {
		console.info("multiplied for left");
		sum = sum * DIRECTION_LEFT_COEF;
	}

	return sum;
}



function shuffle(tiles) {
	var dirs = ["right", "up", "down", "left"];
	var res = [];
	for(var index in dirs) {
		var new_tiles = merge(dirs[index], tiles);
		if(!compare(tiles, new_tiles)) {
			new_tiles.direction = dirs[index];
			res.push(new_tiles);
		}
	}

	return res;
}

function debug(str, obj) {
	console.info(str);
	console.debug(obj);
}

function get_node(tiles) {
	if(tiles == null) {
		return null;
	}
	var obj = new Object();
	obj.direction = tiles.direction || "init";
	obj.tiles = tiles;
	obj.left = null;
	obj.right = null;;
	obj.left = null;
	obj.up = null;
	obj.parent = null;
	obj.fit = 0;
	obj.no = 0;

	return obj;
}

function print_tiles(tiles, fit) {
	fit = fit || 0;
	var res = "direction: " + tiles.direction + "\n";
	res += "fitness: " + fit.toString() + "\n";
	for(i = 1; i <= 4; i ++) {
		var str = ""
		for(j = 1; j <= 4; j++) {
			if(tiles[i][j] != null) {
				str += tiles[i][j].toString() + "    ";
			} else {
				str += "na    ";
			}
		}
		res += str + "\n";
	}
	console.info(res);
}

function print_tiles_obj(obj) {
	var res = "direction: " + obj.tiles.direction + "\n";
	res += "fitness: " + obj.fit.toString() + "\n";
	res += "order number: " + obj.no.toString() + "\n";
	for(i = 1; i <= 4; i ++) {
		var str = ""
		for(j = 1; j <= 4; j++) {
			if(obj.tiles[i][j] != null) {
				str += obj.tiles[i][j].toString() + "    ";
			} else {
				str += "na    ";
			}
		}
		res += str + "\n";
	}
	console.info(res);
}


function compare(first, second) {
	for(row = 1; row <= 4; row ++) {
		for(column = 1; column <= 4; column ++) {
			if(first[row][column] != second[row][column]) {
				return false;
			}
		}
	}

	return true;
}

function build_tree(tiles, depth) {
	var no = 0;
	depth = depth || 3;

	var tree = get_node(tiles);
	var queue = [tree];

	while(queue.length && depth) {
		// get current node from which to expand and the related values
		var d_obj, l_obj, u_obj, r_obj;
		d_obj = l_obj = r_obj = u_obj = null;
		current_node = queue.shift();
		// put the shuffled tiles in the tree;
		// create new node for the newly created tiles (sh_tiles)
		r_obj = get_node(merge("right",current_node.tiles));
		u_obj = get_node(merge("up",current_node.tiles));
		d_obj = get_node(merge("down",current_node.tiles));
		l_obj = get_node(merge("left",current_node.tiles));
		if(l_obj != null) {
			no++;
			l_obj.fit = eval(l_obj.tiles); //* eval_no_tiles(l_obj.tiles);
			current_node.left = l_obj;
			l_obj.parent = current_node;
			l_obj.no = no;
			queue.push(l_obj);
			print_tiles_obj(l_obj);
			// console.info("parent: " + current_node.no);
		}

		if(r_obj != null) {
			no++;
			r_obj.fit = eval(r_obj.tiles); //* eval_no_tiles(r_obj.tiles);
			current_node.right = r_obj;
			r_obj.parent = current_node;
			r_obj.no = no;
			queue.push(r_obj);
			print_tiles_obj(r_obj);
			// console.info("parent: " + current_node.no);
		}

		if(u_obj != null) {
			no++;
			u_obj.fit = eval(u_obj.tiles); //* eval_no_tiles(u_obj.tiles);
			current_node.up = u_obj;
			u_obj.parent = current_node;
			u_obj.no = no;
			queue.push(u_obj);
			print_tiles_obj(u_obj);
			// console.info("parent: " + current_node.no);
		}

		if(d_obj != null) {
			no++;
			d_obj.fit = eval(d_obj.tiles); //* eval_no_tiles(d_obj.tiles);
			current_node.down = d_obj;
			d_obj.parent = current_node;
			d_obj.no = no;
			queue.push(d_obj);
			print_tiles_obj(d_obj);
			// console.info("parent: " + current_node.no);
		}

		depth--;
	}

	tree.parent = null;

	//console.error("number of nodes: " + no.toString());
	return tree;
}

function get_path(tree) {
	console.debug(tree);
	var queue = [tree];
	var max_node = get_node(get_tiles_template());
	var no = 0;
	while(queue.length) {
		no++;
		var current = queue.shift();

		if(max_node.fit < current.fit) {
			max_node = current;
		}

		if(current.right != null) {
			queue.push(current.right);
		}

		if(current.up != null)    {
			queue.push(current.up);
		}

		if(current.down != null)  {
			queue.push(current.down);
		}

		if(current.left != null)  {
			queue.push(current.left);
		}
	}

	var path = new Object();
	path.dirs = [];
	path.fit = max_node.fit;
	// console.debug(max_node);
	// print_tiles_obj(max_node);
	while(max_node != null) {
		console.info(1);
		path.dirs.unshift(max_node.direction);
		max_node = max_node.parent;
	}
	path.dirs.shift();

	return path;
}

// you use this function to reevaluate the current path, in case anything bad happend
function reeval_path(dirs) {
	t = get_tiles();
	for(var i in dirs) {
		t = merge(dirs[i], t);
	}

	return eval(t);
}


var current_path = new Object();
current_path.dirs = [];
current_path.fit = 0;
var k = 2;
var func = function()  {
	latest_path = null;
	tiles_wrk = get_tiles();
	tree_wrk = build_tree(tiles_wrk, 7);
	latest_path = get_path(tree_wrk);

	console.info("reeval_fit: " + reeval_path(current_path.dirs).toString());
	console.info("current_fit: " + current_path.fit);
	if(k == 0 || current_path == null || !current_path.dirs.length || latest_path.fit > reeval_path(current_path.dirs) * FIT_MAGNITUDE)  { // || current_path.fit < latest_path.fit
		current_path = latest_path;
		console.info("changed");
		console.info("current fit: " + current_path.fit);
		console.info("current path: " + current_path.dirs.toString());
		k = 3;
	}


	var dir = current_path.dirs.shift();
	console.info(dir);
	fireKey(dir);
	k--;
}


setInterval(func, 500);