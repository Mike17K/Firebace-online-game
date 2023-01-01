// helper functions
function randomFromArray(array){
    return array[Math.floor(Math.random() * array.length)];
}
function getKetString(x,y){
    return `${x}x${y}`;
}

function isInScreen(player){
    // check if the player is in the screen
    return true;
}
function calculateScreenPosition(x){
    return x
}

function calcDirection(x,y){
    if(x==0 && y==0){
        return {'dx':0,'dy':0};
    }
    
    return {'dx':x/(x*x+y*y),'dy':y/(x*x+y*y)};    
}

(function (){

    let playerId;
    let playerRef;
    let playerElements ={};

    let playerCoords_x = 0;
    let playerCoords_y = 0;

    let step = 15;

    let direction_x = 0;
    let direction_y = 0;

    const gameContainer = document.querySelector(".game-container");


    

    function initGame(){
        const allPlayersRef = firebase.database().ref('players');

        

        function updateFrame(){
            let dir = calcDirection(direction_x,direction_y);
            //console.log(dir);
            playerCoords_x += dir.dx*step;    
            playerCoords_y -= dir.dy*step;

            playerRef.set({
                id: playerId,
                name: "Me",
                direction: "right",
                color: "blue",
                x: playerCoords_x,
                y: playerCoords_y,
                mass: 0
                });
        }
    
        var t=setInterval(updateFrame,10); // run the update method each frame
   
        /*
        var t=setInterval(()=>{
            var offsetRef = firebase.database().ref("/.info/serverTimeOffset");
        offsetRef.on("value", function(snapshot) {
        var offset = snapshot.val();
        var estimatedServerTimeMs = Date.now() + offset;
        // Use the estimated server time to calculate the latency
        console.log("Latency: " + (Date.now() - estimatedServerTimeMs) + "ms");
        });
        },500); // run the update method each frame
        */
        
        playerRef.once('value').then(function(snapshot) {
            const playerData = snapshot.val();
            playerCoords_x = playerData.x;
            playerCoords_y = playerData.y;
          });

        // move agound
        function updateDir(event){
            let op = (event.type === 'keydown')?1:-1;
            
            if (event.code === 'KeyW') {
                // Do something when the W key is pressed
                direction_y += op*1 ;
            } 
            if (event.code === 'KeyA') {
                // Do something when the A key is pressed
                direction_x += -1*op ;
            } 
            if (event.code === 'KeyS') {
                // Do something when the S key is pressed
                direction_y += -1*op ;              
            } 
            if (event.code === 'KeyD') {
                // Do something when the D key is pressed
                direction_x += 1*op ;
            } 
        }
        document.addEventListener('keydown',(event) => updateDir(event) );
        document.addEventListener('keyup',(event) => updateDir(event) );
      

        allPlayersRef.on('value',(snapshot) => {
            // fires whenever a change occurs
            const players = snapshot.val();
            
            for (let playerId in players) {
                let tmp_player = players[playerId];
                
                if(isInScreen(tmp_player)){
                    // update the players position
                    let new_x = calculateScreenPosition(tmp_player.x);
                    let new_y = calculateScreenPosition(tmp_player.y);
                    
                    const target_element = document.querySelector(`.${tmp_player.id}`);
                    //console.log(new_x,new_y);
                    //target_element.style.transform = `translate3d(${new_x}, ${new_y}, 0)`;
                    target_element.style.left = new_x+"px";
                    target_element.style.top = new_y+"px";
                }
                
            }

        });

        allPlayersRef.on('child_removed', (removed_player) => {
            console.log('Player disconnected:', removed_player.key);
            
            const target_element = document.querySelector(`.${removed_player.key}`);
            target_element.parentElement.removeChild(target_element);
        });

        allPlayersRef.on('child_added',(snapshot) => {
            console.log("added");
            // fires whenever a node is added to the tree
            const addedPlayer = snapshot.val();
            const characterElement = document.createElement('div');
            characterElement.classList.add("player",`${addedPlayer.id}`);
            if(addedPlayer.id == playerId){
                characterElement.classList.add("me");
            }
            // character structure
            characterElement.innerHTML = (`
            <div class="Character_shadow grid-cell"></div>
            <div class="Character_sprite grid-cell"></div>
            <div class="Character_name-container">
                <span class="Character_name"></span>
                <span class="Character_mass">0</span>
            </div>
            <div class="Character_you-arrow"></div>
            `);
            playerElements[addedPlayer.id] = characterElement;

            // fill in some initial state
            characterElement.querySelector(".Character_name").innerHTML = addedPlayer.name;
            characterElement.querySelector(".Character_mass").innerHTML = addedPlayer.mass;
            characterElement.setAttribute("data-color",addedPlayer.color);
            characterElement.setAttribute("data-direction",addedPlayer.direction);

            gameContainer.appendChild(characterElement);
        });
    };


    firebase.auth().onAuthStateChanged((user)=>{
        //console.log(user); 
        if(user){
            // your lgged in
            playerId = user.uid;
            playerRef = firebase.database().ref(`players/${playerId}`);

            playerRef.set({
                id: playerId,
                name: "Me",
                direction: "right",
                color: "blue",
                x: playerCoords_x,
                y: playerCoords_y,
                mass: 0
                });
                
            playerRef.onDisconnect().remove();

            console.log("User is signed in correctly");
            initGame()
        }else{
            //yout logged out
            console.log("User is not signed in correctly");
        }

    })

    firebase.auth().signInAnonymously().catch((error)=>{
        console.log(error.code, error.message);
    });


})();