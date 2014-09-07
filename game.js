/* =================== CONSTANTS ========================== */
var TILE_EVAL_BASE = 4; // these two values are used as coeficient for the number of tiles. the more tiles there are, the greater the coeficient
var TILE_EVAL_COEF = 0.5; // so that the algorithm would choose the path that minimises the number of tiles
var LR_STRATEGY_COEF = 2; // the coeficinet for choosing a move in the set (right, up, down) so that all values remain in a corners

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
	var sum = 0;
	for(row = 1; row <= 4; row ++) {
		for(column = 1; column <= 4; column ++) {
			if((val = tiles[row][column]) != null) {
				sum += val * val / 2048;
			}
		}
	}

	return sum;
}

function eval_no_tiles(tiles) {
	var no_tiles = 0;
	for(var i = 1; i <= 4; i++) {
		for(var j = 1; j <= 4; j++) {
			if(tiles[i][j] != null) {
				no_tiles ++;
			}
		}
	}

	return TILE_EVAL_COEF * Math.pow(TILE_EVAL_BASE, no_tiles);
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
	obj.direction = "init";
	obj.tiles = tiles;
	obj.left = null;
	obj.right = null;;
	obj.left = null;
	obj.up = null;
	obj.parent = null;

	return obj;
}

function print_tiles(tiles) {
	var res = "direction: " + tiles.direction + "\n";
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
	depth = depth ? Math.pow(4, depth) : Math.pow(4, 3);

	var tree = get_node(tiles);
	var queue = [tree];

	while(queue.length && depth) {
		// get current node from which to expand and the related values
		var current_node = queue.pop();
		// put the shuffled tiles in the tree;
		// create new node for the newly created tiles (sh_tiles)
		l_obj = get_node(merge("left",current_node.tiles));
		r_obj = get_node(merge("right",current_node.tiles));
		u_obj = get_node(merge("up",current_node.tiles));
		d_obj = get_node(merge("down",current_node.tiles));
		if(l_obj != null) {
			queue.push(l_obj);
			current_node.left = l_obj;
			l_obj.parent = current_node;
			no++;
			// print_tiles(l_obj.tiles);
		}

		if(r_obj != null) {
			queue.push(r_obj);
			current_node.right = r_obj;
			r_obj.parent = current_node;
			no++;
			// print_tiles(r_obj.tiles);
		}

		if(u_obj != null) {
			queue.push(u_obj);
			current_node.up = u_obj;
			u_obj.parent = current_node;
			no++;
			// print_tiles(u_obj.tiles);
		}

		if(d_obj != null) {
			queue.push(d_obj);
			current_node.down = d_obj;
			d_obj.parent = current_node;
			no++;
			// print_tiles(d_obj.tiles);
		}

		depth--;
	}

	console.error("number of nodes: " + no.toString());
	return tree;
}

function get_path(tree) {
	queue = [tree];
	while(queue.length) {
		current = queue.pop();
		if(current.left != null) {
			queue.push(current.left);
		}

		if(current.right != null) {
			queue.push(current.left);
		}

		if(current.up != null) {
			queue.push(current.left);
		}

		if(current.down != null) {
			queue.push(current.left);
		}
	}
}

function get_path() {
	best_sol = {"eval" : "0", "path" : null}
	tree = build_tree(get_tiles());

}

function do_work() {
	curr_tiles = get_tiles();
	fireKey(get_direction(curr_tiles));
}

/*

Create all graph, find best path with the two evaluation functions; holdd that path until a best one is found.
Problems: will a better one arrive? If the current one stays for long, tiles will gather and the new path should be focused more on clearing the tiles.

*/

setInterval(do_work, 10000);