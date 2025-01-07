document.addEventListener("DOMContentLoaded", function () {
  console.log("Script is loaded");

  const FB_SENTENCE = `type this line to find out how many words per minute or wpm you can type`; // fallback sentence in case quotes is not fetched
  const API_URL = `https://api.github.com/gists`;

  let noTimesCalled = 0; // no of times API request is made
  let userInputField = document.querySelector("div#user-type input");
  let testSentence = document.getElementById("test-sentence");
  let isCharAllowed = true;
  let isFirstCharTyped;
  let startTime, initialCursorPos, endTime;
  let isAborted = false;
  let sentenceIndex = 0;

  let audio = document.getElementById("startSound");

  // functionality for toggle switch
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function (event) {
      const targetElem = event.target;
      if (targetElem.id === "input-char") {
        isCharAllowed = !isCharAllowed;
        newGame();
      } else if (targetElem.id === "input-sound") {
        targetElem.checked ? audio.play() : audio.pause();
      }
    });
  });

  // functionality to pause audio on tab/window change
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      document.getElementById("input-sound").checked = false;
      audio.pause();
    }
  });

  // function to fetch quotes from github gist
  async function fetchSentence() {
    try {
      const controller = new AbortController(); // Abort controller to timeout API request
      const timeoutId = setTimeout(() => controller.abort(), 5000); // abort the request after 5 seconds
      const response = await fetch(
        "https://my-server-raj-sinha.vercel.app/api/quotes/v1/quotes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: API_URL,
            limit: 5,
          }),
          signal: controller.signal,
        }
      );

      // If error in fetching data
      if (!response.ok) {
        throw new Error(`Failed to fetch sentence: ${response.statusText}`);
      }
      const data = await response.json();

      if (data) {
        clearTimeout(timeoutId); // If the request is successfull in given time
        return data.quotes;
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

  async function storeSentence() {
    if (localStorage.getItem("quotes") !== null) {
      localStorage.removeItem("quotes");
    }
    let toRetry = false;
    do {
      const quote = await fetchSentence();
      if (quote) {
        toRetry = false;
        localStorage.setItem("quotes", quote);
      } else {
        toRetry = true;
        noTimesCalled++;
      }
    } while (toRetry && noTimesCalled < 4); // limit api call
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
      ? (((totalChars - incorrectChars) / totalChars) * 100).toPrecision(3)
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
    const charCheckboxSlider = document.querySelector(
      ".switch-char span.slider"
    );
    document.querySelector(".switch-char input").disabled = true;
    if (charCheckboxSlider.classList.contains("active")) {
      charCheckboxSlider.classList.remove("active");
      charCheckboxSlider.classList.add("inactive");
    }

    const reloadElem = document.getElementById("reload-message");
    if (reloadElem) {
      let count = 4;
      let reloadElemMsg = reloadElem.textContent;
      reloadElem.textContent = `${reloadElemMsg} ${count}`;
      reloadElem.style.display = "flex";
      reloadElem.style.justifyContent = "center";
      const intervalId = setInterval(() => {
        if (!count) {
          reloadElem.style.display = "none";
          reloadElem.textContent = reloadElemMsg; // reset reload message (without count)
          clearInterval(intervalId);
          abortGame();
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
    userInputField.removeEventListener("input", handleUserInput);
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
    document.getElementById("acc-digit").textContent = calculateAccuracy();
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
        if (!isCharAllowed) {
          // filter out any special characters
          const regex = /^[a-z]$|^&nbsp;$/; // a character can be lowercase letter or space
          return regex.test(character);
        } else {
          return character;
        }
      });
  }

  function handleUserInput(e) {
    let isValidSpace = false;
    let currentLetter = document.querySelector("li.current");
    if (!isFirstCharTyped) {
      startTime = new Date().getTime(); // start timer
      isFirstCharTyped = true;
    }

    // checking if space character
    if (
      e.data &&
      e.data.charCodeAt(0) === 32 && // space key charcter code
      currentLetter.textContent.charCodeAt(0) === 160 // nbsp charcter code
    ) {
      isValidSpace = true;
    }

    if (
      e.data === currentLetter.textContent ||
      isValidSpace ||
      (e.data === "'" &&
        (currentLetter.textContent === "’" ||
          currentLetter.textContent === "'"))
    ) {
      let prevLetterText = currentLetter.innerHTML;
      switch (prevLetterText) {
        case "&nbsp;":
          prevLetterText = "space";
          break;
        case ":":
          prevLetterText = "apos";
          break;
        case '"':
          prevLetterText = "dbqt";
          break;
        case ";":
          prevLetterText = "smcln";
          break;
        case "'":
          prevLetterText = "snqt";
          break;
        case "’":
          prevLetterText = "snqt";
          break;
        case ",":
          prevLetterText = "comma";
          break;
        case ".":
          prevLetterText = "fstp";
          break;
        case "/":
          prevLetterText = "fdsh";
          break;
        case "?":
          prevLetterText = "qmrk";
          break;
        default:
          break;
      }
      if (!currentLetter.classList.contains("incorrect")) {
        currentLetter.classList.add("correct");
      }
      if (currentLetter.nextSibling) {
        currentLetter.classList.remove("current");
        currentLetter.nextSibling.classList.add("current");
        currentLetter = document.querySelector("li.current"); // re-initialize currentLetter
        let currentLetterText = currentLetter.innerHTML;
        switch (currentLetterText) {
          case "&nbsp;":
            currentLetterText = "space";
            break;
          case ":":
            currentLetterText = "apos";
            break;
          case '"':
            currentLetterText = "dbqt";
            break;
          case ";":
            currentLetterText = "smcln";
            break;
          case "'":
            currentLetterText = "snqt";
            break;
          case "’":
            currentLetterText = "snqt";
            break;
          case ",":
            currentLetterText = "comma";
            break;
          case ".":
            currentLetterText = "fstp";
            break;
          case "/":
            currentLetterText = "fdsh";
            break;
          case "?":
            currentLetterText = "qmrk";
            break;
          default:
            break;
        }
        let keyToHighlight = document
          .getElementById("keyboard")
          .querySelector(`#${currentLetterText}`);
        if (keyToHighlight) {
          let keyToRmvHighlight = document
            .getElementById("keyboard")
            .querySelector(`#${prevLetterText}`);
          if (keyToRmvHighlight.nodeName === "SPAN") {
            keyToRmvHighlight = keyToRmvHighlight.parentElement;
          }
          if (keyToRmvHighlight.classList.contains("active")) {
            keyToRmvHighlight.classList.remove("active");
          }
          if (keyToHighlight.nodeName === "SPAN") {
            keyToHighlight = keyToHighlight.parentElement;
          }
          keyToHighlight.classList.add("active");
        }

        // move cursor to next letter
        moveCursor(currentLetter, initialCursorPos);

        // clear input field on space
        if (isValidSpace) {
          userInputField.value = "";
          isValidSpace = false;
        }
      } else {
        let keyToRmvHighlight = document
          .getElementById("keyboard")
          .querySelector(`#${prevLetterText}`);
        if (keyToRmvHighlight.nodeName === "SPAN") {
          keyToRmvHighlight = keyToRmvHighlight.parentElement;
        }
        if (keyToRmvHighlight.classList.contains("active")) {
          keyToRmvHighlight.classList.remove("active");
        }
        currentLetter.classList.remove("current");
        currentLetter = null;
        endTime = new Date().getTime();
        gameOver(startTime, endTime);
      }
    } else {
      currentLetter.classList.add("incorrect");
    }
  }

  // starting game by clearing test sentence except blink cursor
  function startGame() {
    if (document.getElementById("keyboard").querySelector(".active")) {
      document
        .getElementById("keyboard")
        .querySelector(".active")
        .classList.remove("active");
    }
    isFirstCharTyped = false;
    (startTime = 0), (initialCursorPos = 0), (endTime = 0);
    if (userInputField) {
      userInputField.disabled = false;
      userInputField.value = null;
      userInputField.focus();
    }

    if (testSentence) {
      const cursorContainer = testSentence.firstElementChild; // copy an instance of blink cursor element
      testSentence.replaceChildren(); // clear if sentence already exists
      if (cursorContainer) {
        testSentence.appendChild(cursorContainer); // add blink cursor element
        cursorContainer.firstElementChild.style.display = "inline";
        cursorContainer.firstElementChild.style.left = "-5px";
      }
    }
  }

  function getSentence() {
    const quotesList = JSON.parse(localStorage.getItem("quotes"));
    if (quotesList && sentenceIndex < quotesList.length) {
      const charCheckboxSlider = document.querySelector(
        ".switch-char span.slider"
      );
      document.querySelector(".switch-char input").disabled = false;
      if (charCheckboxSlider.classList.contains("inactive")) {
        charCheckboxSlider.classList.remove("inactive");
        charCheckboxSlider.classList.add("active");
      }
      const quoteObj = quotesList[sentenceIndex++];
      return quoteObj.quote;
    }
  }

  // function to abort game
  function abortGame() {
    isAborted = true;
  }

  // main function starts here
  async function newGame() {
    isAborted = false;
    startGame();
    let sentence;
    const fragment = document.createDocumentFragment();

    // Get sentence
    sentence = getSentence();
    if (!sentence) {
      const charCheckboxSlider = document.querySelector(
        ".switch-char span.slider"
      );
      document.querySelector(".switch-char input").disabled = true;
      if (charCheckboxSlider.classList.contains("active")) {
        charCheckboxSlider.classList.remove("active");
        charCheckboxSlider.classList.add("inactive");
      }
      sentence = FB_SENTENCE;
      sentenceIndex = 0;
      storeSentence();
    }
    // extract array of valid chars from sentence
    const letters = getChars(sentence);
    //insert each char into document within li element
    if (testSentence) {
      letters.forEach((letter, index) => {
        fragment.appendChild(addCharacter(letter, index));
      });
      testSentence.appendChild(fragment);
    }

    let currentLetter = document.querySelector("li.current");
    let currentLetterText = currentLetter.innerHTML;
    switch (currentLetterText) {
      case "&nbsp;":
        currentLetterText = "space";
        break;
      case ":":
        currentLetterText = "apos";
        break;
      case '"':
        currentLetterText = "dbqt";
        break;
      case ";":
        currentLetterText = "smcln";
        break;
      case "'":
        currentLetterText = "snqt";
        break;
      case "’":
        currentLetterText = "snqt";
        break;
      case ",":
        currentLetterText = "comma";
        break;
      case ".":
        currentLetterText = "fstp";
        break;
      case "/":
        currentLetterText = "fdsh";
        break;
      case "?":
        currentLetterText = "qmrk";
        break;
      default:
        break;
    }
    let keyToHighlight = document
      .getElementById("keyboard")
      .querySelector(`#${currentLetterText}`);
    if (keyToHighlight) {
      if (keyToHighlight.nodeName === "SPAN") {
        keyToHighlight = keyToHighlight.parentElement;
      }
      keyToHighlight.classList.add("active");
    }

    // initialize cursor position
    initialCursorPos = parseInt(
      document.getElementById("blink-cursor").getBoundingClientRect().left
    );

    //get user input
    if (!isAborted) {
      if (userInputField) {
        userInputField.addEventListener("input", handleUserInput);
      } else {
        console.log("userInputField is null");
      }
    } else {
      console.log("Game is aborted");
    }
  }

  newGame();
});
