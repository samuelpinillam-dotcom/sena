/* Punto de entrada MVC. */
document.addEventListener("DOMContentLoaded", () => {
  const model = new LetterGameModel();
  const view = new LetterGameView();
  new LetterGameController(model, view);
});
