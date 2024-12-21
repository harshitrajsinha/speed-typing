/* TODO: 
- handle backspace
- resolve error on restart game
- use cookies/localStorage to fetch token once from gist
*/

document.addEventListener("DOMContentLoaded", function () {
  console.log("Script is loaded");

  let noTimesCalled = 0; // no of times API request is made
  let userInputField = document.querySelector("div#user-type input");
  const authorizedToken = null;

  // function to fetch quotes from github gist
  async function fetchSentence(gistId) {
    const url = `https://api.github.com/gists/${gistId}`; //unauthenticated - 60 requests per hour; authenticated - 5000 requests per hour for a user
    const volumeOfAvailSentence = 100; // no of available sentence
    const randomIndex = Math.floor(Math.random() * volumeOfAvailSentence) + 1;
    try {
      const controller = new AbortController(); // Abort controller to timeout API request
      const timeoutId = setTimeout(() => controller.abort(), 5000); // abort the request after 5 seconds
      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });
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

  // function to calc accuracy
  function calculateAccuracy() {
    const totalChars = document.querySelectorAll(
      "#test-sentence .letter"
    ).length;
    const incorrectChars = document.querySelectorAll(
      "#test-sentence .incorrect"
    ).length;
    return totalChars
      ? Number(((totalChars - incorrectChars) / totalChars).toPrecision(3)) *
          100
      : 0;
  }

  // function to calc WPM
  function calculateWPM(timeTaken) {
    const wordsArr = Array.from(document.querySelectorAll(".letter"));
    const totalWords = wordsArr
      ? wordsArr.filter((elem) => elem.innerHTML === "&nbsp;").length + 1
      : 0;
    return Math.floor(60 / timeTaken) * totalWords;
  }

  // functionality after game over
  function showReloadMsg() {
    const reloadElem = document.getElementById("reload-message");
    if (reloadElem) {
      let count = 4;
      let reloadElemMsg = reloadElem.textContent;
      reloadElem.textContent = `${reloadElemMsg} ${count}`;
      reloadElem.style.display = "flex";
      const intervalId = setInterval(() => {
        if (!count) {
          reloadElem.style.display = "none";
          reloadElem.textContent = reloadElemMsg; // reset reload message (without count)
          clearInterval(intervalId);
          newGame();
          return;
        }
        count -= 1;
        reloadElem.textContent = `${reloadElemMsg} ${count}`;
      }, 1000);
    }
  }

  // function once game is over
  function gameOver(startTime, endTime) {
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    const blinkCursor = document.getElementById("blink-cursor");
    if (userInputField) {
      userInputField.disabled = true; // disable input field
    }
    if (blinkCursor) {
      blinkCursor.style.display = "none"; // remove blink cursor
    }
    document.getElementById("wpm-digit").textContent = String(
      calculateWPM(timeTaken)
    );
    document.getElementById("acc-digit").textContent = String(
      calculateAccuracy()
    );
    showReloadMsg();
  }

  // moving blink cursor to next character
  function moveCursor(currentLetter, initialCursorPos) {
    let cursor = document.getElementById("blink-cursor");
    if (cursor) {
      cursor.style.left = `${
        parseInt(currentLetter.getBoundingClientRect().left) -
        initialCursorPos -
        10
      }px`;
    }
  }

  // Adding each character into html element
  function addCharacter(letter, letterId) {
    const elem = document.createElement("li");
    elem.id = letterId;
    elem.classList.add("letter");
    if (!letterId) {
      elem.classList.add("current");
    }
    elem.innerHTML = letter;
    return elem;
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
        const regex = /^[a-z]$|^&nbsp;$/; // a character can be lowercase letter or space
        return regex.test(character);
      });
  }

  // starting game by clearing test sentence except blink cursor
  function startGame() {
    if (userInputField) {
      userInputField.disabled = false;
      userInputField.value = null;
      userInputField.focus();
    }
    const testSentence = document.getElementById("test-sentence");
    if (testSentence) {
      const cursorContainer = testSentence.firstElementChild; // get blink cursor element
      while (testSentence.firstChild) {
        // clear if sentence already exists
        testSentence.removeChild(testSentence.firstChild);
      }
      if (cursorContainer) {
        testSentence.appendChild(cursorContainer);
        cursorContainer.firstElementChild.style.display = "inline";
        cursorContainer.firstElementChild.style.left = "-5px";
      }
    }
  }

  // main function starts here
  async function newGame() {
    startGame();
    //return;
    const gistId = "74e6aa84acb838ade097f146643bd6a9";
    const fallbackSentence = `type this line to find out how many words per minute or wpm you can type`;
    let sentence = ``;
    const testSentence = document.getElementById("test-sentence");
    const fragment = document.createDocumentFragment();

    const quote = await fetchSentence(gistId); // fetch unique sentence
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

    // extracting array of valid chars from sentence
    const letters = getChars(sentence);

    //insert each char into document within li element
    if (testSentence) {
      letters.forEach((letter, index) => {
        fragment.appendChild(addCharacter(letter, index));
      });
      testSentence.appendChild(fragment);
    }

    const initialCursorPos = parseInt(
      document.getElementById("blink-cursor").getBoundingClientRect().left
    );
    let currentLetter = document.querySelector("li.current");
    let isValidSpace = false;
    let isFirstCharTyped = false;
    let startTime = 0;

    //get user input
    if (userInputField) {
      userInputField.addEventListener("input", function (e) {
        //console.log(e);

        if (!isFirstCharTyped) {
          startTime = new Date().getTime();
          isFirstCharTyped = true;
        }

        // checking if space character
        if (
          e.data &&
          e.data.charCodeAt(0) === 32 && // space charcter code
          currentLetter.textContent.charCodeAt(0) === 160 // nbsp charcter code
        ) {
          isValidSpace = true;
        }

        if (e.data === currentLetter.textContent || isValidSpace) {
          if (!currentLetter.classList.contains("incorrect")) {
            currentLetter.classList.add("correct");
          }
          if (currentLetter.nextSibling) {
            currentLetter.classList.remove("current");
            currentLetter.nextSibling.classList.add("current");
            currentLetter = document.querySelector("li.current"); // re-initialize currentLetter

            // move cursor to next letter
            moveCursor(currentLetter, initialCursorPos);

            // clear input field on space
            if (isValidSpace) {
              userInputField.value = "";
              isValidSpace = false;
            }
          } else {
            currentLetter = "";
            let endTime = new Date().getTime();
            gameOver(startTime, endTime);
          }
        } else {
          currentLetter.classList.add("incorrect");
        }
      });
    }
  }

  newGame();
});
