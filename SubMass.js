let pixelratio = 1; // this is the ratio of the world pixels to the screen pixels

function localToWorld(coords){
    return coords/pixelratio;
};
function worldToLocal(coords){
    return coords*pixelratio;
};


export class SubMass {
    static instances = {};

    constructor(parentId,mass = 10, position = {"x":0,"y":0}, velocity = {"x":0,"y":0}, force = {"x":0,"y":0}, name = "an unnamed cell") {
      this.mass = mass;
      this.position = position;
      this.velocity = velocity;
      this.force = force;

      this.name = name;
      this.radius = this.mass/3.14;
    
      this.id = `${parentId}-${Object.keys(SubMass.instances).length}`;
      this.subMassRef = firebase.database().ref(`submasses/${this.id}`);
      this.subMassRef.onDisconnect().remove()

      this.upload();

      SubMass.instances[this.id]=this;
    }

    destructor(){
        this.subMassRef.remove(); // this is not working
    }

    move(dt){  
        this.calculateColision();
        // b = 3.14 * r * r
        // a.x = ΣF.x / m = ( Force.x - b * velocity.x ) / m 
        // a.y = ΣF.y / m = ( Force.y - b * velocity.y ) / m 
        this.radius = this.mass/3.14;
        let b = 15*3.14 * this.radius ; // air resistance
        let acceleration = {
            "x":( this.force.x - b * this.velocity.x ) / this.mass ,
            "y":( this.force.y - b * this.velocity.y ) / this.mass
        };
    
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        
        this.velocity.x += acceleration.x * dt;
        this.velocity.y += acceleration.y * dt;
    } 
    
    applyForce(force = {"x":0,"y":0}){
        this.force = force;
    }

    upload(){
        this.subMassRef.set({
            color: 'blue',
            id: this.id,
            "mass":this.mass,
            "radius":this.radius,
            "name":this.name,
            x: this.position.x,
            y: this.position.y,
            });
    }

    calculateColision(){
        let MAX_COLISION_FORCE = 1000;
        let isColiding = false;
        let newForce = {'x':0, 'y':0};
        Object.keys(SubMass.instances).forEach((subMass_key)=>{
            const e = SubMass.instances[subMass_key];
            const distance = Math.sqrt(Math.pow(this.position.x-e.position.x, 2) + Math.pow(this.position.y-e.position.y,2));
            //console.log(distance);
            if(distance<this.radius+e.radius && e.id!=this.id){
                //console.log("Colision");
                isColiding=true;

                let xfactor = (this.position.x-e.position.x)*5;
                let yfactor = (this.position.y-e.position.y)*5;

                if(xfactor>MAX_COLISION_FORCE){
                    newForce.x += MAX_COLISION_FORCE;
                }else{
                    newForce.x += xfactor;
                }
                
                if(yfactor>MAX_COLISION_FORCE){
                    newForce.y += MAX_COLISION_FORCE;
                }else{
                    newForce.y += yfactor;
                }
            }
        });

        this.force.x += newForce.x*1000000/this.mass;
        this.force.y += newForce.y*1000000/this.mass;
    }

  }
