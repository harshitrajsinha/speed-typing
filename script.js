/* TODO: 
- format sentences from capital letters and special chars by using search algorithm
- add abort controller
- handle backspace
- show WPM and accuracy
- handle end game
*/

document.addEventListener("DOMContentLoaded", function () {
  console.log("Script is loaded");
  document.querySelector("div#user-type input").focus();

  let noTimesCalled = 0;

  // Fetch quotes
  async function fetchGist(gistId) {
    const randomIndex = Math.floor(Math.random() * 100) + 1;
    console.log(randomIndex);
    try {
      const response = await fetch(`https://api.github.com/gists/${gistId}`);

      // If error in fetching data
      if (!response.ok) {
        throw new Error(`Failed to fetch sentence: ${response.statusText}`);
      }
      const data = await response.json();

      if (data) {
        const quotesList = data["files"]["quotes.txt"]["content"];
        return JSON.parse(quotesList)[randomIndex];
      }
    } catch (error) {
      console.error("Error occured", error.message);
      return null;
    }
  }

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

  async function newGame() {
    const gistId = "74e6aa84acb838ade097f146643bd6a9"; // 100 lower-case, non-special characters quotes
    const fallbackSentence = `type this line to find out how many words per minute or wpm you can type`;

    const quote = await fetchGist(gistId);
    let sentence = ``;
    if (quote) {
      sentence = quote["quote"];
      if (sentence.split("").length > 72) {
        if (noTimesCalled < 4) {
          console.log("entered here");
          // reacall game
          noTimesCalled += 1;
          sentence = ``;
          newGame();
        } else {
          sentence = fallbackSentence;
          noTimesCalled = 0;
        }
      }
    } else {
      sentence = fallbackSentence;
    }

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

//https://gist.github.com/harshitrajsinha/74e6aa84acb838ade097f146643bd6a9
