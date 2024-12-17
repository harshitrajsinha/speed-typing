/* TODO: 
- handle backspace
- show WPM and accuracy
- handle end game
*/

document.addEventListener("DOMContentLoaded", function () {
  console.log("Script is loaded");
  document.querySelector("div#user-type input").focus();

  let noTimesCalled = 0;

  // function to fetch quotes from github gist
  async function fetchGist(gistId, token) {
    const randomIndex = Math.floor(Math.random() * 100) + 1;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // setTimeout to abort the request after 10 seconds
      const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
        signal: controller.signal,
      });
      //console.log(response);
      // If error in fetching data
      if (!response.ok) {
        throw new Error(`Failed to fetch sentence: ${response.statusText}`);
      }
      const data = await response.json();

      if (data) {
        clearTimeout(timeoutId); // If the request is successfull in given time
        const quotesList = data["files"]["quotes.txt"]["content"];
        return JSON.parse(quotesList)[randomIndex];
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request timed out");
        return null;
      } else {
        console.error("Error occured", error.message);
        return null;
      }
    }
  }

  // Formatting each character into html element
  function formatCharacter(letter, letterId) {
    return `<li id=${letterId} class="letter ${letterId === 0 ? "current" : ""}">${letter}</li>`;
  }

  // Split sentence into characters
  function getChars(sentence) {
    return sentence
      .split("")
      .map((character) =>
        character !== " " ? character.toLowerCase() : "&nbsp;"
      )
      .filter((character) => {
        // filter out any special characters
        const regex = /^[a-zA-Z]+$|^&nbsp;$/;
        return regex.test(character);
      });
  }

  function startTimer(reloadElem, userInputField) {
    let reloadElemMsg = reloadElem.textContent;
    let count = 4;
    setInterval(() => {
      if (!count) {
        if (userInputField) {
          userInputField.value = "";
        }
        reloadElem.style.display = "none";
        //newGame();

        return;
      }
      count -= 1;
      reloadElem.textContent = `${reloadElemMsg} ${count}`;
    }, 1000);
  }

  // function once game is over
  function gameOver() {
    const userInputField = document.querySelector("div#user-type input");
    const blinkCursor = document.getElementById("blink-cursor");
    const reloadElem = document.getElementById("reload-message");
    if (userInputField) {
      userInputField.disabled = true;
    }
    if (blinkCursor) {
      blinkCursor.style.display = "none";
    }
    if (reloadElem) {
      reloadElem.style.display = "flex";
      startTimer(reloadElem, userInputField);
    }
  }

  function startGame() {
    const testType = document.getElementById("test-type");
    if (testType) {
      const blinkCursor = testType.firstElementChild;
      testType.innerHTML = null;
      if (blinkCursor) {
        testType.appendChild(blinkCursor);
      }
    }
  }

  // main function starts here
  async function newGame() {
    startGame();
    const gistId = "74e6aa84acb838ade097f146643bd6a9";
    const token = "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";
    const fallbackSentence = `type this line to find out how many words per minute or wpm you can type`;

    const quote = await fetchGist(gistId, token);
    let sentence = ``;
    if (quote) {
      sentence = quote["quote"];
      if (sentence.split("").length > 72) {
        if (noTimesCalled < 4) {
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
    const letters = getChars(sentence);
    //insert each letter into document as an li element
    const testPara = document.getElementById("test-type");
    if (testPara) {
      letters.forEach((letter, index) => {
        testPara.innerHTML += formatCharacter(letter, index);
      });
      //testPara.innerHTML += `<li id="last" class="letter"></li>`;
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
          if (currentLetter.nextSibling) {
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
            gameOver();
            return;
          }
        } else {
          currentLetter.classList.add("incorrect");
        }
      });
    }
  }

  newGame();
});
