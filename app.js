import { SubMass } from './SubMass.js';

// =============================================================================
//local_coords = {'x': width/2 + camera_world_coords.x-player_world_coords.x,'y':height/2 + camera_world_coords.y-player_world_coords.y};   

var WORLD_SIZE_X=30000;
var WORLD_SIZE_Y=30000;

(function (){
    let pixelratio = 1; // this is the ratio of the world pixels to the screen pixels

    function localToWorld(coords){
        return coords/pixelratio;
    };
    function worldToLocal(coords){
        return coords*pixelratio;
    };
    
    const gameContainer = document.querySelector(".game-container");

    let allPlayersRef;
    let allSubMassesRef;
    
    let playerElements = {};

    let playerId;
    let playerRef;
    let player_name='Mike';
    let mass = 100;

    let MAX_FORCE=150;

    let camera_coords = {"x":0,"y":0};
    let mouse_coords_local = {"x":0,"y":0};

    function initGame(){

        new SubMass(playerId,mass);
        new SubMass(playerId,mass);
        new SubMass(playerId,mass);
        new SubMass(playerId,mass);
        new SubMass(playerId,mass);
        new SubMass(playerId,mass);
        new SubMass(playerId,mass);
        new SubMass(playerId,1000,{'x':200,'y':0});
        
    
        var frameloop=setInterval(()=>{

            for (var id of Object.keys(SubMass.instances)) {
                let subMass = SubMass.instances[id];
                

                let fx = localToWorld(mouse_coords_local.x)-subMass.position.x;
                let fy = localToWorld(mouse_coords_local.y)-subMass.position.y;
                
                
                let force = Math.sqrt(fx*fx+fy*fy)*4;
                if (force>MAX_FORCE) {
                    //console.log(force);
                    force=MAX_FORCE; 
                }

                let theta;
                if(fx==0 && fy>0) theta = 3.14/2;
                if(fx==0 && fy<0) theta = 3*3.14/2;
                if(fx==0 && fy==0) theta = 0;
                if(fx>0) theta = Math.atan(fy/fx);
                if(fx<0) theta = 3.14+Math.atan(fy/fx);
                //fix

                subMass.applyForce({
                    "x":(Math.cos(theta)*force)*10000,
                    "y":(Math.sin(theta)*force)*10000
                });
                
                
                subMass.move(0.001);
                
                if(subMass.position.x >WORLD_SIZE_X) subMass.position.x=WORLD_SIZE_X;
                 if(subMass.position.x <-WORLD_SIZE_X) subMass.position.x=-WORLD_SIZE_X;
                 if(subMass.position.y >WORLD_SIZE_Y) subMass.position.y=WORLD_SIZE_Y;
                 if(subMass.position.y <-WORLD_SIZE_Y) subMass.position.y=-WORLD_SIZE_Y;
                
                 
                subMass.upload();
            }
            
        },1); 
   

        document.addEventListener('mousemove', (event) => {
            mouse_coords_local.x = event.clientX - window.innerWidth/2;
            mouse_coords_local.y = event.clientY - window.innerHeight/2;       
          });
      
        
        allSubMassesRef.on('value',(snapshot) => {
            // fires whenever a change occurs
            const subMasses = snapshot.val();
                for (let subMass in subMasses) {
                    let tmp_subMass = subMasses[subMass];
                    
                    const target_element = document.querySelector(`.${tmp_subMass.id}`);
                    
                    // change something if u want                
                    target_element.style.width = 2*worldToLocal(tmp_subMass.radius)+'px';
                    target_element.style.height = 2*worldToLocal(tmp_subMass.radius)+'px';
                    
                    target_element.style.left = worldToLocal(camera_coords.x+tmp_subMass.x -tmp_subMass.radius) + window.innerWidth/2 +'px';
                    target_element.style.top =  worldToLocal(camera_coords.y+tmp_subMass.y -tmp_subMass.radius) + window.innerHeight/2 +'px';
                    target_element.style.display = 'block';
                }

        });

        allPlayersRef.on('value',(snapshot) => {
            // fires whenever a change occurs
            const players = snapshot.val();
            
            for (let playerId in players) {
                let tmp_player = players[playerId];
                const target_element = document.querySelector(`.${tmp_player.id}`);
                // change something if u want                
            }

        });

        function divRemove(removed_player){
            console.log('Player disconnected:', removed_player.key);
            
            const target_element = document.querySelector(`.${removed_player.key}`);
            target_element.parentElement.removeChild(target_element);
        }
        allSubMassesRef.on('child_removed', divRemove);
        allPlayersRef.on('child_removed', divRemove);

        function onMassAdded(snapshot) {
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

            gameContainer.appendChild(characterElement);
        }

        allSubMassesRef.on('child_added',onMassAdded);
        //allPlayersRef.on('child_added',onMassAdded);

    };


    // =============================================================================
    // =============================================================================
    // =============================================================================

    firebase.auth().onAuthStateChanged((user)=>{
        if(user){
            // your lgged in
            playerId = user.uid;
            playerRef = firebase.database().ref(`players/${playerId}`);

            allPlayersRef = firebase.database().ref('players');     
            allSubMassesRef = firebase.database().ref('submasses');    
            
            playerRef.set({
                id: playerId,
                name: player_name,
                color: 'blue',
                mass
                });
                
            playerRef.onDisconnect().remove();
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