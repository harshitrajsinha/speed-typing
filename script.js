document.addEventListener("DOMContentLoaded", function () {
  console.log("Script is loaded");
  document.querySelector("div#user-type input").focus();

  const sentence = `type this line to find out how many words per minute or wpm you can type`;

  // Formatting each letter into html element
  function formatLetter(letter, letterId) {
    return `<li id=${letterId} class="letter ${letterId === 0 ? "current" : ""}">${letter}</li>`;
  }

  // Split sentence into letters and space
  function getLetters(sentence) {
    return sentence
      .split("")
      .map((letter) => (letter !== " " ? letter : "&nbsp;"));
  }

  function newGame() {
    const letters = getLetters(sentence);

    //insert each letter into document
    const testPara = document.getElementById("test-type");
    if (testPara) {
      letters.forEach((letter, index) => {
        testPara.innerHTML += formatLetter(letter, index);
      });
      testPara.innerHTML += `<li id=${-1} class="letter"></li>`;
    }

    let currentLetter = document.querySelector("li.current");
    let cursor = document.getElementById("blink-cursor");
    const initialCursorPos = parseInt(cursor.getBoundingClientRect().left);
    let isSpace = false;

    //get user input
    const userInput = document.querySelector("div#user-type input");
    if (userInput) {
      userInput.addEventListener("input", function (e) {
        // console.log(e);

        // Handling space character
        if (
          e.data.charCodeAt(0) === 32 &&
          currentLetter.textContent.charCodeAt(0) === 160
        ) {
          isSpace = true;
        }

        if (
          e.data === currentLetter.textContent ||
          (e.data.charCodeAt(0) === 32 &&
            currentLetter.textContent.charCodeAt(0) === 160)
        ) {
          if (!currentLetter.classList.contains("incorrect")) {
            currentLetter.classList.add("correct");
          }
          currentLetter.nextSibling.classList.add("current");
          currentLetter.classList.remove("current");
          // re-initialize currentLetter
          currentLetter = document.querySelector("li.current");

          // move cursor to next letter
          cursor.style.left = `${
            parseInt(currentLetter.getBoundingClientRect().left) -
            initialCursorPos -
            10
          }px`;

          // clear input field on space
          if (isSpace) {
            userInput.value = "";
            isSpace = false;
          }
        } else {
          currentLetter.classList.add("incorrect");
        }
      });
    }
  }

  newGame();
});

// handle backspace
