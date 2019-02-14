var res = "images/"
var gameBoard
var pawnColor
var urlServer = "http://127.0.0.1:8899"
var peer,conn,turn
var debug = true
var dimen = 19
var passCounter = 0
var whiteCaptured = 0;
var blackCaptured = 0;

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
	updatePawnIcon((turn+1)%2)
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


function setMinTextSize( obj, percentage ){
	if( $('.yourMessage').height()*0.3 > 12 )
		obj.css('font-size', $('.yourMessage').height()*percentage )
	else
		obj.css('font-size', 12)
}

function responsiveBehaviour(){
	var boardW = $('.boardcss').width()-5;

	var size = Math.floor(boardW/dimen)
	$('.row').height(size)

	$('.boardCell').width(size)
	$('.boardCell').height(size)
	$('.pawn').width(size)
	$('.pawn').height(size)

	var loc = $('.boardcss').offset()
	$('#errordiv').css('top', ($('.boardcss').outerHeight()- $('#errordiv').height())/2 + loc.top + 'px')
	$('#errordiv').css('left', ($('.boardcss').outerWidth() - $('#errordiv').width())/2 + loc.left + 'px')

	$('.chat').height( $('#board').height()*0.90 )
	$('.chat').width( ($('.gameContainer').width() -  $('#board').width())*0.9 )
	$('.chat').css('margin-top', $('.chat').height()*0.04 )
	$('.chat').css('margin-bottom', $('.chat').height()*0.05 )

	$('.buttondiv').css('padding-top', ($('.buttondiv').height() - $('.sendbutton').height())/2 -1 )
	$('.buttondiv').css('padding-bottom', ($('.buttondiv').height() - $('.sendbutton').height())/2 -1)

	setMinTextSize( $('.yourMessage'), 0.3 )
	setMinTextSize( $('.divcolor'), 0.4 )

	$('textarea').css('height', '70%')
	$('.yourMessage').attr("placeholder")

	$('.sendbutton').css('font-size', Math.floor($('.buttondiv').height()*0.5) )
	$('.sendbutton').css('margin-top', Math.floor( ($('.buttondiv').height() - $('.sendbutton').height())/2 ) )

	$('.toInsert').css('font-size', Math.floor($('.row').height()-5)*2) 

	if ( $('.gameContainer').height() > window.innerHeight - 51){
		$('.whitepage').height( $('.gameContainer').height() ) 
	}
	else{
		$('.whitepage').height( window.innerHeight - 51)
	}
}


function appendMessageToDiv( msg, type ){
	var messagebox = document.getElementById('messagecontainer')
	
	var innerDiv = document.createElement('div')
	if(type == 'info'){
		console.log('infomessage')
		innerDiv.className = 'infobox'
	}
	else{
		innerDiv.className = "divcolor"

		if( !type ){
			innerDiv.className += ' darker'
		}
		else
			innerDiv.className += ' clear'
	}
	
	innerDiv.textContent += msg
	messagebox.appendChild(innerDiv)
	setMinTextSize( $('.divcolor'), 0.4 )

	$('#messagecontainer').animate({scrollTop: $('#messagecontainer').prop("scrollHeight")}, 500);
}

function sendMessage(){
	if(conn){
		conn.send( { 'msg': $('.yourMessage').val() } )
		appendMessageToDiv($('.yourMessage').val(), pawnColor )
		$('.yourMessage').val('')
	}
	else{
		$('.yourMessage').val('')
		$('.yourMessage').attr("placeholder", "No peer connected");
		$('.yourMessage').addClass('redMessage')

		setTimeout(function(){
			$('.yourMessage').attr("placeholder", "Insert here your message");
			$('.yourMessage').removeClass('redMessage')
		},2000)
	}
}

/*
*
*	Setup page handlers
*
*/
function setUpHandlers(){
	
	$(window).on('beforeunload', function(){
		
		/* rimuovere id dal server */
		sendPOSTforPeerIdEliminationtoServer(peer.id)	
		if(conn != null) conn.send( {'win': true, 'turn' : null, 'position' : null} )
	
		sessionStorage.clear()
	})	
	

	$(window).unload(function(){
		/* rimuovere id dal server */
		sendPOSTforPeerIdEliminationtoServer(peer.id)	
		if(conn != null) conn.send( {'win': true, 'turn' : null, 'position' : null} )
	
		sessionStorage.clear()
	})
    
	$(window).resize(function(){
		responsiveBehaviour()
	})

	$('.sendbutton').on('click',function(){
		sendMessage()
	})

    $("#turnPass").on('click', function(){
        if ( !$(".boardcss").attr('class').includes("disabled") ) {
			console.log("Vuoi passare il turno, il tunto attuale è " + turn )
			passCounter++
			checkPassCounter()
			conn.send( { 'turn' : turn, 'position' : null} )		
			updatePawnIcon((turn+1)%2)
			$(".boardcss").addClass('disabled')
        }
	})
    
	$("#surrender").on('click', function(){
		console.log("Vuoi abbandonare la partita")
		if (confirm ("Sei sicuro di voler abbandonare la partita? ") ){
			conn.send( {'win': true, 'turn' : null, 'position' : null} )

			setTimeout( function(){ 
				peerDisconnect()
			}, 1000)
			location.href = "index.html"
		}
	})

	$(".yourMessage").bind("keypress", {}, keypressInBox);	
    
    function keypressInBox(e) {
        var code = (e.keyCode ? e.keyCode : e.which);
        if (code == 13) { //Enter keycode                        
            e.preventDefault();
            sendMessage()
        }
    };

    
    
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
	$('.turnDiv').css('visibility','visible')
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


function updatePawnIcon(t){
	if ( !t ){
		$('.pawnTurn').css('background-image','url(images/perla_nera.svg)')
	}
	else{
		$('.pawnTurn').css('background-image','url(images/perla_bbianca.svg)')
	}
}

/*
*
*	Update turn
*
*/
function updateTurn(t){
	turn = ( t+1 ) % 2
	updatePawnIcon(turn)
	$(".boardcss").removeClass('disabled')
}

/*
*
*	Update the turn and insert the new pawn
*

function updateBoard(msg){
	placePawn( msg.position )
	updateTurn( turn )
}*/

function messageSwitcher(msg){
    //id 
	if(msg.id != null){
		otherID = msg.id
	}
	//caso generico del passo turno o piazza pedina
	else if( msg.turn != null ){
        turn = msg.turn
        if (msg.position != null)
            placePawn( msg.position )
        else{
			appendMessageToDiv('The other player passed his turn', 'info')
			passCounter++
			checkPassCounter()
		}
		updateTurn( turn )
    }
    //quando arriva un messaggoo per la chat
	else if( msg.msg != null ){
		appendMessageToDiv( msg.msg, (pawnColor+1)%2 )
	}
	
	// messaggio di vittoria
	else if ( msg.win != null ){ //&& msg.turn == null && msg.position == null  ){
        if (msg.win == true){
           alert("The other player left the game, you WIN") 
            peerDisconnect()
            location.href = "index.html"
        }
	}
	
}



function listOfGroups(){
	var groups = {'w': [], 'b': []}
	for(var x = 0; x < dimen; x++){
		for(var y = 0; y < dimen; y++){
			if( gameBoard[x][y] == 1) {
				var connectedPawns = findGroups( new Array(), {'x': x, 'y': y}, 1 )
				var found = false
				for ( var group of groups.b){
					if(!found)
					for (var pawn of group){
						if( pawn.x == connectedPawns[0].x && pawn.y == connectedPawns[0].y ){
							found = true
						}
					}
				}
				if(!found){
					groups.b.push(connectedPawns)
				}
			}
			else if( gameBoard[x][y] == 2){
				var connectedPawns = findGroups( new Array(), {'x': x, 'y': y}, 2 )
				var found = false
				for ( var group of groups.w){
					if(!found)
					for (var pawn of group){
						if( pawn.x == connectedPawns[0].x && pawn.y == connectedPawns[0].y ){
							found = true
						}
					}
				}
				if(!found){
					groups.w.push(connectedPawns)
				}
			}
		}
	}

	console.log(groups)

	return groups
}


function isPresent(x,y,listLiberties){
	for(var l of listLiberties){
		if ( l.x == x && l.y == y){
			return true
		}
	}
	listLiberties.push({'x':x, 'y':y})
	return false
}


function countGruoupLiberties ( whiteList,  blackList ) {
	var whiteCount = 0 
	var blackCount = 0

	var liberties = []

	for (var gruppo of whiteList){
		for ( var pedina of gruppo){
			if (pedina.x + 1 < gameBoard[0].length && gameBoard[pedina.x + 1 ][pedina.y] == 0 && !isPresent(pedina.x+1, pedina.y, liberties) ) {
				whiteCount++
			}   
			if (pedina.x - 1 >= 0 && gameBoard[pedina.x-1 ][pedina.y] == 0 && !isPresent(pedina.x-1, pedina.y, liberties) ) {
				whiteCount++
			}      
			if (pedina.y + 1 < gameBoard[0].length && gameBoard[pedina.x][pedina.y + 1 ] == 0 &&  !isPresent(pedina.x, pedina.y+1, liberties) ) {
				whiteCount++
			}   
			if (pedina.y - 1 >= 0 && gameBoard[pedina.x][pedina.y - 1] == 0 && !isPresent(pedina.x, pedina.y-1, liberties) ){
				whiteCount++
			}
		}
	}

	liberties = []

	for (var gruppo of blackList){
		for ( var pedina of gruppo){
			if (pedina.x+1 < gameBoard[0].length && gameBoard[pedina.x+1][pedina.y] == 0 && !isPresent(pedina.x+1, pedina.y, liberties) ){
				blackCount++
			}   
			if (pedina.x - 1 >=  0 && gameBoard[pedina.x - 1 ][pedina.y] == 0 && !isPresent(pedina.x-1, pedina.y, liberties) ){
				blackCount++	
			}      
			if (pedina.y + 1 < gameBoard[0].length && gameBoard[pedina.x][pedina.y + 1 ] == 0 && !isPresent(pedina.x, pedina.y+1, liberties) ){
				blackCount++				
			}   
			if (pedina.y - 1>=0 && gameBoard[pedina.x ][pedina.y-1] == 0 && !isPresent(pedina.x, pedina.y-1, liberties) ){
				blackCount++
			}  
		}
	}
	console.log(whiteCount,blackCount)
	return  { 'wCount' : whiteCount, 'bCount' : blackCount}
}


function checkPassCounter () {
	console.log(passCounter)
	if (passCounter == 2 ){
		console.log (" Eseguire ordine 66 ")
		var groups = listOfGroups()
		console.log(groups)
		// conto le liberta di tutti i gruppi
		var groupLibCounter =  countGruoupLiberties ( groups.w, groups.b)
		var libertabianche = groupLibCounter.wCount
		var libertanere = groupLibCounter.bCount
		//sottraggo le pedine perse
		var totbianco = libertabianche - whiteCaptured
		var totnero = libertanere - blackCaptured
		console.log ( "totale nero:  " + totnero + "totale bianco:  " +  totbianco)
		if (pawnColor == 0){
			if (totnero > totbianco){
				alert( "Congratulations you WIN")
				location.href = "index.html"
			}else if (totnero < totbianco ) {
				alert( "Sorry you LOST")
				location.href = "index.html"
			}else {
				alert( "It's a draw")
				location.href = "index.html"
			}
		}else if (pawnColor == 1){
			if (totnero <  totbianco){
				alert( "Congratulations you WIN")
				location.href = "index.html"
			}else if ( totnero >   totbianco) {
				alert( "Sorry you LOST")
				location.href = "index.html"
			}else {
				alert( "It's a draw")
				location.href = "index.html"
			}
		}
		
	}


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
			conn.on( 'open', function() {
				onConnectionOpen(myID,otherID)
				appendMessageToDiv('you have white pawns', 'info')
				$('.turnDiv').css('visibility','visible')
				updatePawnIcon(turn)
			})
			conn.on('data', function(message){
				messageSwitcher(message)
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
					appendMessageToDiv('you have black pawns', 'info')
					updatePawnIcon(turn)
				})
				

				conn.on( 'data', function(message){
					messageSwitcher(message)
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
	passCounter = 0
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
								if( color == 1 ) whiteCaptured += group.length
								else if( color == 2 ) blackCaptured += group.length
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
								if( color == 1 ) whiteCaptured += group.length
								else if( color == 2 ) blackCaptured += group.length
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



