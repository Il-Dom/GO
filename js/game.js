var res = "images/"
var gameBoard
var pawnColor
var urlServer = "http://127.0.0.1:8899"
var peer,conn,turn
var debug = true
var dimen = 19

/*
*
*	Return a string rappresentation of n like "0Val" if val is <= 9
*
*/
function digify(n){ 
	return n > 9 ? "" + n: "0" + n
}

/*
*
*	Disconnect a peer from peerJs 
*
*/
function peerDisconnect(){
	console.log("disconnectiong peer")
	conn.close()
	peer.disconnect()
	peer.destroy()
}

/*
*
*	Disable board while waiting for a response
*
*/
function waitForResponse( pos ){
	$(".boardcss").addClass('disabled') //.prop('disabled',true).off('click')
	conn.send( { 'turn':turn,'position':pos } )
}
	
/*
*
*	Create the correct image for the goban div
*
*/
function retrieveImage( cell, x, y, img ){
	var corner = "url(\""+res + img +"-corner.png\")";
	var edge = "url(\""+res + img +"-edge.png\")";

	if( x==1 && y==1 ){
		cell.style.backgroundImage = corner;
	}
	else if ( x==dimen && y==1 ){
		$(cell).css("transform", "rotate(270deg)");
		cell.style.backgroundImage = corner;
	}
	else if ( x==dimen && y==dimen ){
		$(cell).css("transform", "rotate(180deg)");
		cell.style.backgroundImage = corner;
	}
	else if ( x==1 && y==dimen ){
		$(cell).css("transform", "rotate(90deg)");
		cell.style.backgroundImage = corner;
	}
	else if( x == 1 ){
		cell.style.backgroundImage = edge;
	} 
	else if( y == 1 ){
		$(cell).css("transform", "rotate(270deg)");
		cell.style.backgroundImage = edge;
	}
	else if( y == dimen ){
		$(cell).css("transform", "rotate(90deg)");
		cell.style.backgroundImage = edge;
	}
	else if( x == dimen ) {
		$(cell).css("transform", "rotate(180deg)");
		cell.style.backgroundImage = edge;
	}
}


function responsiveBehaviour(){
	var boardW = $('.boardcss').width()-5;

	var size = Math.floor(boardW/dimen)
	$('.row').height(size)

	$('.boardCell').width(size)
	$('.boardCell').height(size)

	var loc = $('.boardcss').offset()
	$('#errordiv').css('top', ($('.boardcss').outerHeight()- $('#errordiv').height())/2 + loc.top + 'px')
	$('#errordiv').css('left', ($('.boardcss').outerWidth() - $('#errordiv').width())/2 + loc.left + 'px')

	$('.chat').height($('#board').height()*0.90)
	$('.chat').width( ($('.gameContainer').width() -  $('#board').width())*0.9 )
	$('.chat').css('margin-top', $('.chat').height()*0.05 )
	$('.chat').css('margin-bottom', $('.chat').height()*0.05 )

	$('.sendbutton').css('font-size',$('.buttondiv').height()*0.7)

	$('.toInsert').css('font-size', Math.floor($('.row').height()-5)*2) 
}

/*
*
*	Setup page handlers
*
*/
function setUpHandlers(){
	$(document).unload(function () {
		peerDisconnect();
	})
	$(window).unload(function(){
		/* rimuovere id dal server */
		sessionStorage.clear()
	})
	$(window).resize(function(){
		responsiveBehaviour()
	})
}
	
function createBoard(dimension){
	dimen = dimension
	var boardW = $('.boardcss').width()-5;

	var size = Math.floor(boardW/dimen)
	gameBoard = new Array(dimen).fill(dimen).map(() => new Array(dimen).fill(0));

	for(var r = 1; r <= dimen; r++){
		var row = document.createElement("div"); 
		row.className = "row";
		row.id = "row"+digify(r);
		row.style.height = size;
		
		for(var c = 1; c <= dimen; c++){ 
			/*creating a cell with the relative style*/
			var cell = document.createElement("div"); 
			cell.id = ""+digify(r)+digify(c);
			cell.className = "boardCell";
			cell.style.backgroundImage = "url(\""+res +"wood1-center.png\")";
			cell.style.width = size;
			cell.style.height = size;
			retrieveImage(cell, r, c, "wood1");				
			
			/*creating pawn and appending to the cell*/
			var pawn = document.createElement('div');
			pawn.className = 'pawn';
			pawn.style.width = size;
			pawn.style.height = size;
			
			cell.appendChild(pawn);

			/*handler functions
			modificare la funzione hover con lo straming dei dati*/
			$(cell).hover(function(){
				if(turn){
					$(this).find('div:first').css('background-image','url(images/perla_bbianca.svg)');
				}
				else{
					$(this).find('div:first').css('background-image','url(images/perla_nera.svg)');
				}
				
				$(this).find('div:first').css('visibility','visible');
			},function(){
				$(this).find('div:first').css('visibility','hidden');
			});

			$(cell).on('click',function(){
				placePawn( this.id ); 
			});
			
			row.appendChild(cell); 
		} 
		board.appendChild(row);
	}

	responsiveBehaviour()
}

/*
*
*	Gray board 
*
*/
function grayBoard(message){
	$(".boardcss").addClass('disabled').addClass('grayed')
	$(".pawn").hide()

	var toInsert = $('<div id=\'errordiv\'>'+message+'</div>')
	var loc = $('.boardcss').offset()
	toInsert.appendTo('#wrapper')
	toInsert.addClass('toInsert')
	toInsert.css('font-size', Math.floor($('.row').height()-5)*2) 
	toInsert.css('top', ($('.boardcss').outerHeight()- toInsert.height())/2 + loc.top + 'px')
	toInsert.css('left', ($('.boardcss').outerWidth() - toInsert.width())/2 + loc.left + 'px')
}

/*
*
*	ungray board 
*
*/
function ungrayBoard(){
	$(".boardcss").removeClass('disabled').removeClass('grayed')
	$(".pawn").show()
	$('#errordiv').remove()
}

/*
*	
*	Send a Post request for deleting host id from the server
*
*/
function sendPOSTforPeerIdEliminationtoServer ( peerToRemove ){
	if (peerToRemove != null){
		$.ajax({
			type:'post',
			url: urlServer+"/removePeer",
			dataType: "text/plain",
			data: JSON.stringify({ "id":  peerToRemove }),
			error: function(a,b,c){
				//alert(c,"staccah")
			}
		})
	}			
		
}	

function onConnectionOpen(mine, other){
	console.log('Hi ' + other + ' I am '+ mine, 'turn:',turn)
	conn.send( {'id': mine} )
	$('.boardcss').addClass('disabled')
}

/*
*
*	Update turn
*
*/
function updateTurn(t){
	turn = ( t+1 ) % 2
	$(".boardcss").removeClass('disabled')
}

/*
*
*	Update the turn and insert the new pawn
*
*/
function updateBoard(msg){
	turn = msg.turn

	placePawn( msg.position )
	updateTurn( turn )
}

/*
*
*	On ready page loads setUpHandlars, wait for other peer connection
*
*/
$(document).ready(function(){
	createBoard(dimen)

	setUpHandlers()
	
	var myID = sessionStorage.getItem('connectionID')
	var otherID =  sessionStorage.getItem('otherID') 
	
	if( myID == null ){
		grayBoard('Invalid ID')
	}
	else{
		peer = new Peer(myID)
		turn = 0

		if(otherID != null){
			conn = peer.connect(otherID)

			pawnColor = 1

			conn.on( 'open', function() {onConnectionOpen(myID,otherID)} )

			conn.on('data', function(message){
				if(message.turn != null){
					updateBoard(message)
				}
			})
			
		}
		else{
			grayBoard('Waiting for player...')

			pawnColor = 0
			peer.on('connection', function(c) {
				conn = c
				conn.on('open', function() {
					ungrayBoard()
					sendPOSTforPeerIdEliminationtoServer(myID)
				})

				conn.on( 'data', function(message){
					if(message.id != null){
						otherID = message.id
					}
					else if( message.turn != null ){
						updateBoard(message)
					}
				});
			})
		}
	}
})

/*
*
*	Place a pawn on the go ban
*
*/
function placePawn(obj){
	var middle = Math.ceil( obj.length / 2);
	var x = parseInt(obj.slice(0,middle))-1;
	var y = parseInt(obj.slice(middle))-1;
	
	if( gameBoard [x][y] == 0 ){
		if( turn == 0 ){
			if(!checkLiberty(findGroups( new Array(),{'x': x, 'y': y}, 1))) {
				alert('you\'re killing yourself dude') 
				return
			}
			gameBoard[x][y] = 1;
			$('#'+obj).find('div:first').css('background-image','url(images/perla_nera.svg)')
			checkNearGroups ( x, y, 1)
		}
		else{
			if(!checkLiberty(findGroups( new Array(),{'x': x, 'y': y}, 2))) {
				alert('you\'re killing yourself dude') 
				return
			}
			gameBoard[x][y] = 2;
			$('#'+obj).find('div:first').css('background-image','url(images/perla_bbianca.svg)')
			checkNearGroups ( x, y, 2)
		}

		$('#'+obj).find('div:first').css('visibility','visible');
		$('#'+obj).unbind('mouseenter mouseleave');

		if(turn == pawnColor) waitForResponse( obj )
	}
}   

/*
*
*	Finds nearby gruop in all cross direction
*
*/
function findGroups(acc, pos, color){
	if ( acc === undefined || acc.length == 0){
		acc.push(pos);
	}
	else if ( !acc.some(e => e.x === pos.x && e.y===pos.y) ){
		acc.push(pos);
	}
	else{
		return acc;
	}

	if (pos.x + 1 < gameBoard[0].length) {
		if( gameBoard[pos.x+1][pos.y] == color) {
			acc=findGroups(acc,{'x':pos.x+1,'y':pos.y},color);
		}
	}
	if( pos.y - 1  > 0 ){
		if( gameBoard[pos.x][pos.y-1] == color ){
			acc=findGroups(acc,{'x':pos.x,'y':pos.y-1},color);
		}
	}

	if (pos.x - 1 >  0 ){
		if( gameBoard[pos.x-1][pos.y] == color ){
			acc=findGroups(acc,{'x':pos.x-1,'y':pos.y},color);
		}
	}
	if( pos.y + 1  < gameBoard[0].length ){
		if( gameBoard[pos.x][pos.y+1] == color){
			acc=findGroups(acc,{'x':pos.x,'y':pos.y+1},color);
		}
	}
   
	return acc;
}

/*
*
*	Checks if groups nearby have freedom, if not delete them
*
*/
function  checkNearGroups ( x , y, color ) {
	var cross = [ -1 , 1]

	for ( i = 0; i < 2 ; i++ ){
		if ( (i % 2) == 0){
			cross.forEach ( function ( crossVal ){
				// se c'è una pedina nella casella della croce  del colore opposto alla tua controlla il suo gruppo
				if ( x + crossVal < gameBoard[0].length  && x + crossVal >= 0  ){
					if ( gameBoard[x + crossVal ][y] == ( (color % 2) + 1) ){
						var group = findGroups( new Array(),{'x': x + crossVal, 'y': y}, ( (color % 2) + 1))
						if (group != null || group != [] ){
							if ( ! checkLiberty (group) ){
								removeGroup(group)
							}
						} 
					}
				}
			})
		}else{ // per le posizioni sopra e sotto
			cross.forEach ( function ( crossVal ){
				// se c'è una pedina nella casella della croce  del colore opposto alla tua controlla il suo gruppo
				if ( y + crossVal < gameBoard[0].length  && y + crossVal >= 0  ){ 
					if ( gameBoard[x][y + crossVal  ] == ( (color % 2) + 1) ){
						var group = findGroups( new Array(),{'x': x , 'y': y  + crossVal }, ( (color % 2) + 1))
					   
						if (group != null || group != [] ){
							if ( ! checkLiberty (group) ){
								removeGroup(group)  
							}
						}   
					} 
				}
			})
		}
	}
}

/*
*
*	Remove a group and set back css properties of pawn div
*
*/
function removeGroup ( groupies ){
	for ( var groupie of groupies){
		//le caselle in groupies sono sfalsate di una riga una colonna perchè partono da 1
		var xToRemove =  groupie.x
		var yToRemove =  groupie.y
		faiBelleXeY(groupie)
		//ho x e y cerco il div che ha id 'xy'
		gameBoard[xToRemove][yToRemove] = 0
		$('#' + groupie.x + groupie.y).find('div:first').css('visibility','hidden')
		$('#' + groupie.x + groupie.y).hover(function(){
			if(turn == 0 ){
				$(this).find('div:first').css('background-image','url(images/perla_nera.svg)');
			}
			else{
				$(this).find('div:first').css('background-image','url(images/perla_bbianca.svg)');
			}  
			$(this).find('div:first').css('visibility','visible')
		},function(){
			$(this).find('div:first').css('visibility','hidden')}
		)
		$('#' + groupie.x + groupie.y).on('click',function(){
			placePawn(this); 
		})
	}
}

/*
*
*	Return a string rappresentation of obj.x++ and obj.y++ as "0Value" if value is below 9 
*
*/
function faiBelleXeY ( obj ){
	obj.x++
	obj.y++
	obj.x = digify(obj.x)
	obj.y = digify(obj.y)
}

/*
*
*	Return false if the group has no liberties
*
*/
function checkLiberty ( groupies ){
	for ( var groupie of groupies){
		var pedina = groupie
		
		if (pedina.x + 1 < gameBoard[0].length ){
			if (gameBoard[pedina.x + 1 ][pedina.y] == 0 ){
				return true
			} 
		}   
		if (pedina.x - 1 >=   0 ){
			if (gameBoard[pedina.x - 1 ][pedina.y] == 0 ){
				return true
			} 
		}      
		if (pedina.y + 1 < gameBoard[0].length ){
			if (gameBoard[pedina.x][pedina.y + 1 ] == 0 ){
				return true
			} 
		}   
		if (pedina.y - 1 >=  0 ){
			if (gameBoard[pedina.x ][pedina.y - 1] == 0 ){
			   return  true
			} 
		}      
	}
	return false
}



