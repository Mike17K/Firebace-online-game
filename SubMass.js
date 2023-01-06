export class SubMass {
    static instances = {};

    constructor(parentId,mass = 10, position = {"x":0,"y":0}, velocity = {"x":0,"y":0}, force = {"x":0,"y":0}, name = "an unnamed cell") {
      this.mass = mass;
      this.position = position;
      this.velocity = velocity;
      this.force = force;

      this.name = name;
      this.radius = Math.sqrt(this.mass/3.14/0.05);
    
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
        // b = 3.14 * r * r
        // a.x = ΣF.x / m = ( Force.x - b * velocity.x ) / m 
        // a.y = ΣF.y / m = ( Force.y - b * velocity.y ) / m 
        this.radius = Math.sqrt(this.mass/3.14/0.05);
        let b = 15*3.14 * this.radius; // air resistance
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

    }

  }

  
