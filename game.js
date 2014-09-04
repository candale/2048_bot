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

function merge(direction, tiles) {
	new_tile = get_tiles_template()
	switch(direction) {
		case "down": {
			for(column = 1; column <= 4; column ++) {
				curr_row = 4
				for(row = 4; row >= 1; row --) {
					if(tiles[row][column] == null) {
						continue;
					}

					ahead_row = row - 1;
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
		}
		case "up": {
			for(column = 1; column <= 4; column ++) {
				curr_row = 1
				for(row = 1; row <= 4; row ++) {
					console.info(row.toString() + " : " + column.toString());
					console.info(curr_row);
					if(tiles[row][column] == null) {
						continue;
					}

					ahead_row = row + 1;
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
		}
		case "left": {
			for(row = 1; row <= 4; row ++) {
				curr_col = 1
				for(column = 1; column <= 4; column ++) {
					console.info(row.toString() + " : " + column.toString());
					console.info(curr_col);
					if(tiles[row][column] == null) {
						continue;
					}

					ahead_col = column + 1;
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
		}

		// if there is only one value on right, and you move it to the left it moves the value to the left but the other value remains
		case "right": {
			for(row = 1; row <= 4; row ++) {
				curr_col = 4
				for(column = 4; column >= 1; column --) {
					console.info(row.toString() + " : " + column.toString());
					console.info(curr_col);
					if(tiles[row][column] == null) {
						continue;
					}

					ahead_col = column - 1;
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
	}
	return new_tile;
}

t = get_tiles()
tt = merge("left", t)