/* MODELO MVC: banco de palabras, dificultad y progreso. */
class LetterGameModel {
  constructor() {
    const data = [
      ['SEMAFORO','Semáforo','🚦','Tiene luces de colores y organiza el tránsito.'],['BICICLETA','Bicicleta','🚲','Tiene dos ruedas y pedales.'],['GUITARRA','Guitarra','🎸','Instrumento musical de cuerdas.'],['MARIPOSA','Mariposa','🦋','Insecto con alas coloridas.'],['PLANETA','Planeta','🪐','Cuerpo celeste que gira alrededor de una estrella.'],['ELEFANTE','Elefante','🐘','Animal grande con trompa.'],['TORTUGA','Tortuga','🐢','Reptil que lleva un caparazón.'],['PINGUINO','Pingüino','🐧','Ave que nada y vive en zonas frías.'],['DINOSAURIO','Dinosaurio','🦕','Animal prehistórico.'],['CASCADA','Cascada','🏞️','Agua que cae desde una altura.'],['VOLCAN','Volcán','🌋','Montaña que puede expulsar lava.'],['ARCOIRIS','Arcoíris','🌈','Aparece en el cielo cuando hay sol y gotas de agua.'],['ESTRELLA','Estrella','⭐','Objeto brillante que vemos en el cielo.'],['COHETE','Cohete','🚀','Vehículo que viaja al espacio.'],['AVION','Avión','✈️','Vehículo que vuela.'],['BARCO','Barco','⛵','Vehículo que navega por el agua.'],['CAMARA','Cámara','📷','Sirve para tomar fotografías.'],['RELOJ','Reloj','⏰','Sirve para medir el tiempo.'],['LIBRO','Libro','📚','Tiene páginas e historias o información.'],['MOCHILA','Mochila','🎒','Sirve para llevar útiles escolares.'],['MANZANA','Manzana','🍎','Fruta que puede ser roja o verde.'],['BANANO','Banano','🍌','Fruta amarilla y alargada.'],['NARANJA','Naranja','🍊','Fruta cítrica de color naranja.'],['FRESA','Fresa','🍓','Fruta roja con pequeñas semillas.'],['GIRASOL','Girasol','🌻','Flor que suele orientarse hacia la luz.'],['ARANA','Araña','🕷️','Tiene ocho patas.'],['DELFIN','Delfín','🐬','Mamífero marino muy inteligente.'],['JIRAFA','Jirafa','🦒','Animal con cuello muy largo.'],['LEON','León','🦁','Felino conocido como rey de la selva.'],['ZAPATO','Zapato','👟','Se usa en los pies para caminar.'],['CORAZON','Corazón','❤️','Símbolo asociado con el afecto.'],['LLAVE','Llave','🔑','Sirve para abrir una cerradura.'],['TREN','Tren','🚆','Vehículo que circula sobre rieles.'],['HELADO','Helado','🍦','Postre frío y dulce.'],['BOSQUE','Bosque','🌲','Lugar con muchos árboles.'],['FARO','Faro','🗼','Guía a los barcos desde la costa.'],['CORONA','Corona','👑','Adorno que llevan reyes y reinas.'],['TAMBOR','Tambor','🥁','Instrumento musical de percusión.'],['NUBE','Nube','☁️','Se forma en la atmósfera.'],['QUESO','Queso','🧀','Alimento elaborado con leche.']
    ];
    this.items = data.map(([word,label,emoji,hint],id)=>({word,label,emoji,hint,id,image:`assets/imagenes/palabras/${word.toLowerCase()}.svg`}));
    this.difficulty = 'facil'; this.bag=[]; this.lastIndex=-1; this.level=1; this.lives=3; this.gameOver=false; this.index=Math.floor(Math.random()*this.items.length); this.lastIndex=this.index; this.reset();
  }
  get current(){return this.items[this.index]}
  getDifficultyForLevel(){ return this.level < 4 ? 'facil' : this.level < 8 ? 'normal' : 'dificil'; }
  reset({preserveLives=false}={}){const remainingLives=preserveLives?this.lives:3;this.position=0;this.complete=false;this.gameOver=false;this.lives=remainingLives;this.selectedIndices=[];this.mistakes=0;this.revealedHint=false;this.nodes=this.makeNodes(this.current.word);return this.snapshot()}
  next(){
    if (!this.complete && !this.gameOver) return this.snapshot();
    if (this.complete) this.level++;
    if(!this.bag.length){this.bag=this.items.map((_,i)=>i).filter(i=>i!==this.lastIndex);for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]]}}
    this.index=this.bag.pop();this.lastIndex=this.index;return this.reset({preserveLives:true})
  }
  makeNodes(word){
    // Las fichas objetivo se mezclan con distractores que forman parte de
    // palabras relacionadas o visualmente plausibles, no solo letras al azar.
    const nodes=word.split('').map((letter,order)=>({letter,order,target:true}));
    // La dificultad no se elige en un menú: comienza fácil y aumenta automáticamente.
    this.difficulty = this.getDifficultyForLevel();
    const baseCount={facil:70,normal:130,dificil:190}[this.difficulty];
    // Cada nivel suma distractores; los tramos suben de dificultad sin regalar vidas.
    const count=Math.min(280,baseCount+Math.floor((this.level-1)*7));
    const decoys={
      SEMAFORO:['CALLE','TRANSITO','LUZ','ROJO','VERDE','AMARILLO','CARRO','CRUCE'],
      BICICLETA:['RUEDA','CASCO','PEDAL','MOTO','MANUBRIO','CICLA'],
      GUITARRA:['MUSICA','CUERDA','SONIDO','BAJO','PIANO','TAMBOR'],
      MARIPOSA:['ALA','ORUGA','INSECTO','ABEJA','POLILLA','FLOR'],
      PLANETA:['ESPACIO','TIERRA','LUNA','MARTE','ORBITA','ESTRELLA'],
      ELEFANTE:['TROMPA','ANIMAL','COLMILLO','JIRAFA','RINOCERONTE'],
      TORTUGA:['CAPARAZON','REPTIL','PLAYA','HUEVO','LAGARTO'],
      PINGUINO:['HIELO','AGUA','AVE','FOCA','NIEVE','ALAS'],
      DINOSAURIO:['FOSIL','HUESO','REPTIL','TIRANOSAURIO','JURASICO'],
      CASCADA:['AGUA','RIO','ROCA','LLUVIA','LAGO','FUENTE'],
      VOLCAN:['HUMO','LAVA','FUEGO','MONTAÑA','ROCA','CRATER','CENIZA'],
      ARCOIRIS:['COLOR','LLUVIA','CIELO','SOL','NUBE','PRISMA'],
      ESTRELLA:['LUNA','CIELO','PLANETA','GALAXIA','COMETA','SOL'],
      COHETE:['ESPACIO','NASA','LUNA','FUEGO','MOTOR','ASTRONAUTA'],
      AVION:['ALA','VUELO','AEROPUERTO','HELICOPTERO','NUBE'],
      BARCO:['MAR','OLA','VELERO','PUERTO','AGUA','LANCHA'],
      CAMARA:['FOTO','LENTE','VIDEO','CELULAR','IMAGEN'],
      RELOJ:['HORA','TIEMPO','MINUTO','ALARMA','CALENDARIO'],
      LIBRO:['PAGINA','CUENTO','LEER','CUADERNO','NOVELA'],
      MOCHILA:['MALETA','BOLSO','CUADERNO','LAPIZ','COLEGIO'],
      MANZANA:['FRUTA','PERA','ROJA','JUGO','SEMILLA'],
      BANANO:['PLATANO','FRUTA','AMARILLO','CASCARA','MANGO'],
      NARANJA:['FRUTA','LIMON','MANDARINA','JUGO','CITRICO'],
      FRESA:['FRUTA','ROJA','MORA','FRAMBUESA','SEMILLA'],
      GIRASOL:['FLOR','PETALO','JARDIN','SOL','TULIPAN'],
      ARANA:['TELARAÑA','INSECTO','OCHO','PATA','ESCORPION'],
      DELFIN:['MAR','BALLENA','AGUA','ALETA','TIBURON'],
      JIRAFA:['CUELLO','SABANA','MANCHAS','ELEFANTE','CEBRA'],
      LEON:['RUGIDO','FELINO','TIGRE','MELENA','SABANA'],
      ZAPATO:['PIE','BOTA','TENIS','CORDON','SANDALIA'],
      CORAZON:['AMOR','SANGRE','ORGANO','LATIDO','CARIÑO'],
      LLAVE:['CERRADURA','PUERTA','CANDADO','CLAVE','METAL'],
      TREN:['RIELES','VAGON','ESTACION','METRO','LOCOMOTORA'],
      HELADO:['FRIO','POSTRE','CONO','NIEVE','PALETA'],
      BOSQUE:['ARBOL','HOJA','SELVA','MADERA','ANIMAL'],
      FARO:['COSTA','BARCO','LUZ','MAR','TORRE'],
      CORONA:['REY','REINA','ORO','JOYAS','CASTILLO'],
      TAMBOR:['MUSICA','RITMO','BAQUETA','BATERIA','SONIDO'],
      NUBE:['LLUVIA','CIELO','VAPOR','TORMENTA','NIEBLA'],
      QUESO:['LECHE','COMIDA','PAN','VACA','YOGUR']
    };
    const related=(decoys[word]||[]).join('').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z]/g,'');
    const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    // Aproximadamente 70% de las fichas distractoras vienen de conceptos
    // relacionados y 30% son ruido aleatorio para que el tablero no dé pistas obvias.
    for(let i=0;i<count;i++){
      // La mayoría de distractores proceden de conceptos asociados a la imagen:
      // pueden sugerir varias respuestas posibles, pero nunca forman una segunda solución válida.
      const useRelated=related.length && Math.random()<0.82;
      const source=useRelated?related:alphabet;
      nodes.push({letter:source[Math.floor(Math.random()*source.length)],order:-1,target:false});
    }
    for(let i=nodes.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[nodes[i],nodes[j]]=[nodes[j],nodes[i]]}
    return nodes
  }
  choose(i){
    if(!Number.isInteger(i) || !this.nodes[i]) return {status:'invalid'};
    if(this.gameOver) return {status:'gameover'};
    // Permite deseleccionar una letra ya elegida. Si se retira una letra intermedia,
    // también se retiran las posteriores para conservar una conexión coherente.
    const selectedAt=this.selectedIndices.indexOf(i);
    if(selectedAt!==-1){
      this.selectedIndices=this.selectedIndices.slice(0,selectedAt);
      this.position=this.selectedIndices.length;
      this.complete=false;
      return {status:'deselected',position:this.position};
    }
    if(this.complete) return {status:'complete'};
    const node=this.nodes[i];
    const expected=this.current.word[this.position];
    // Compara la letra, no un índice objetivo fijo: cualquiera de las letras
    // repetidas (por ejemplo, cualquiera de las O) puede ocupar esa posición.
    if(node.letter===expected){
      this.selectedIndices.push(i);
      this.position=this.selectedIndices.length;
      if(this.position===this.current.word.length){this.complete=true;return {status:'complete',letter:node.letter};}
      return {status:'correct',letter:node.letter,position:this.position};
    }
    this.mistakes++;
    this.lives = Math.max(0, this.lives - 1);
    if(this.mistakes >= 3) this.revealedHint = true;
    if(this.lives === 0) { this.gameOver = true; return {status:'gameover', expected, wrongIndex:i, mistakes:this.mistakes, lives:this.lives}; }
    return {status:'incorrect',expected,wrongIndex:i,mistakes:this.mistakes,lives:this.lives,revealedHint:this.revealedHint};
  }
  snapshot(){return{word:this.current.word,label:this.current.label,emoji:this.current.emoji,image:this.current.image,hint:this.current.hint,position:this.position,complete:this.complete,level:this.level,lives:this.lives,gameOver:this.gameOver,difficulty:this.difficulty,selectedIndices:[...this.selectedIndices],mistakes:this.mistakes||0,revealedHint:!!this.revealedHint,nodes:this.nodes.map(n=>({...n}))}}
}
