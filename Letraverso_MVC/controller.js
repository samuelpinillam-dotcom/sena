/* CONTROLADOR: recibe elecciones y coordina modelo y vista. */
class LetterGameController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.view.bind({
      onPick: index => this.pick(index),
      onNext: () => this.next(),
      onReset: () => this.reset()
    });
    this.wrongTimer = null;
    this.view.setState(this.model.snapshot());
  }
  pick(index) {
    const result = this.model.choose(index);
    if (result.status === "deselected") {
      this.view.setState(this.model.snapshot());
      this.view.setFeedback("", "Letra deseleccionada. Puedes volver a elegirla.", "La conexión se actualizó y las letras anteriores permanecen unidas.");
    } else if (result.status === "correct") {
      this.view.setState(this.model.snapshot());
      this.view.setFeedback("success", `¡Bien! La letra ${result.letter} está conectada.`);
    } else if (result.status === "complete") {
      this.view.setState(this.model.snapshot());
      this.view.setFeedback("success", `¡Nivel superado! Descubriste ${this.model.current.label.toUpperCase()}.`, "Las conexiones quedan guardadas. Pulsa Siguiente nivel para avanzar.");
    } else if (result.status === "gameover") {
      this.view.setState(this.model.snapshot());
      this.view.flashWrong(result.wrongIndex);
      this.view.setFeedback("error", `¡Sin vidas! La palabra era: ${this.model.current.label.toLocaleUpperCase("es")}.`, `Pista: ${this.model.current.hint} Puedes intentarlo otra vez con 3 vidas.`);
      clearTimeout(this.wrongTimer);
      this.wrongTimer = setTimeout(() => this.view.clearWrong(result.wrongIndex), 650);
    } else if (result.status === "incorrect") {
      // Al fallar, solo se actualiza el contador de vidas; no se muestran mensajes
      // ni marcas que puedan confundir al jugador.
      this.view.setState(this.model.snapshot());
      this.view.setFeedback("silent", "", "");
      clearTimeout(this.wrongTimer);
    }
  }
  next() {
    if (this.model.gameOver) {
      // La respuesta ya se reveló: avanzar a una palabra distinta, sin subir el nivel.
      this.model.lives = 3;
      this.view.setState(this.model.next());
      this.view.setFeedback("", `Nivel ${this.model.level}: nueva palabra y 3 vidas.`, "La palabra revelada no se repetirá hasta que se agote el banco de palabras.");
      return;
    }
    this.view.setState(this.model.next());
    this.view.setFeedback("", `Nivel ${this.model.level}: nueva palabra. Vidas restantes: ${this.model.lives}.`, "Las vidas se conservan al avanzar de nivel. Observa la imagen y prueba las letras con cuidado.");
  }
  reset() {
    this.model.level = 1;
    if (this.model.gameOver) {
      // Si se reinicia después de revelar la solución, tampoco se repite esa palabra.
      this.model.lives = 3;
      this.view.setState(this.model.next());
    } else {
      this.view.setState(this.model.reset());
    }
    this.view.setFeedback("", "Partida reiniciada: Nivel 1, 3 vidas.", "Observa la imagen y prueba las letras con cuidado.");
  }
}
