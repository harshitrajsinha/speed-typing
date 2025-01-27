import getHands from "./hands.js";

window.addEventListener("load", function () {
  console.log("DOM is loaded");

  const FB_SENTENCE = `type this line to find out how many words per minute or wpm you can type`; // fallback sentence in case quotes is not fetched
  const SERVER_API_URL = `https://my-server-raj-sinha.vercel.app/api/quotes/v1/quotes`;

  let noTimesCalled = 0; // no of times API request is made
  let userInputField = document.querySelector("div#user-input input");
  let wordsContainer = document.getElementById("words-container");
  let audio = document.getElementById("windy-hill-music");
  let isCharAllowed = true;
  let isFirstCharTyped;
  let startTime, initialCursorPosLeft, initialCursorPosTop, endTime;
  let isAborted = false;
  let sentenceIndex = 0; // keeps track of current sentence fetched from localStorage
  const leftCursor = window
    .getComputedStyle(document.getElementById("letter-tracker"))
    .getPropertyValue("left");
  const topCursor = window
    .getComputedStyle(document.getElementById("letter-tracker"))
    .getPropertyValue("top");

  if (sessionStorage.getItem("sentenceTrack") !== null) {
    sentenceIndex = sessionStorage.getItem("sentenceTrack");
  } else {
    sessionStorage.setItem("sentenceTrack", sentenceIndex);
  }

  // functionality for toggle switch
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function (event) {
      const targetElem = event.target;
      if (targetElem.id === "input-char") {
        isCharAllowed = !isCharAllowed;
        sentenceIndex--;
        sessionStorage.setItem("sentenceTrack", sentenceIndex);
        newGame();
      } else if (targetElem.id === "input-sound") {
        targetElem.checked ? audio.play() : audio.pause();
      }
    });
  });

  // functionality to pause audio on tab/window change
  document.addEventListener("visibilitychange", (event) => {
    if (event.target.visibilityState !== "visible") {
      document.getElementById("input-sound").checked = false;
      audio.pause();
    }
  });

  // function to fetch quotes from github gist
  async function fetchSentence() {
    try {
      const controller = new AbortController(); // Abort controller to timeout API request
      const timeoutId = setTimeout(() => controller.abort(), 10000); // abort the request after 10 seconds of calling fetchSentence()
      const response = await fetch(SERVER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 5,
        }),
        signal: controller.signal,
      });

      // If error in fetching data
      if (!response.ok) {
        throw new Error(`Failed to fetch sentence: ${response.statusText}`);
      }
      if (
        response.headers.get("Content-Type") &&
        response.headers.get("Content-Type").includes("application/json")
      ) {
        const data = await response.json();

        if (data) {
          clearTimeout(timeoutId); // If the request is successfull in given time
          return data.quotes;
        }
      } else {
        throw new Error("Response is not JSON:", contentType);
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
      "#words-container .letter"
    ).length;
    const incorrectChars = document.querySelectorAll(
      "#words-container .incorrect"
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
      "#switch-char span.slider"
    );
    document.querySelector("#switch-char input").disabled = true;
    document.querySelector("#switch-char input").title = "harshit";
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
    const blinkCursor = document.getElementById("letter-tracker");
    if (userInputField) {
      userInputField.disabled = true; // disable input field
    }
    if (blinkCursor) {
      blinkCursor.style.display = "none"; // remove blink cursor
    }
    document.getElementById("wpm__value").textContent = String(
      calculateWPM(timeTaken)
    );
    document.getElementById("accuracy__value").textContent =
      calculateAccuracy();
    showReloadMsg();
  }

  // moving blink cursor to next character
  function moveCursor(
    currentLetter,
    initialCursorPosLeft,
    initialCursorPosTop
  ) {
    let cursor = document.getElementById("letter-tracker");
    if (cursor) {
      cursor.style.left = `${
        parseInt(currentLetter.getBoundingClientRect().left) -
        initialCursorPosLeft -
        10
      }px`;
      cursor.style.top = `${
        parseInt(currentLetter.getBoundingClientRect().top) -
        initialCursorPosTop -
        parseInt(topCursor)
      }px`;
    }
  }

  // function to abort game
  function abortGame() {
    isAborted = true;
  }

  function createImageElem(attributes) {
    const imgElem = document.createElement("img");
    imgElem.src = attributes[0];
    imgElem.classList.add(attributes[1]);
    return imgElem;
  }

  // function to show hands as per key
  function handsToProcess(key) {
    const { leftHand, rightHand } = getHands(String(key));
    document.getElementById("left").replaceChildren();
    document.getElementById("right").replaceChildren();
    document.getElementById("left").append(createImageElem(leftHand));
    document.getElementById("right").append(createImageElem(rightHand));
  }

  // function to highlight keyboard keys
  function activeInactiveKeys(character, event) {
    let currentLetterText;
    switch (character) {
      case "&nbsp;":
        currentLetterText = "key-space";
        break;
      case ":":
        currentLetterText = "colon";
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
      case '"':
        currentLetterText = "dbqt";
        break;
      case ",":
        currentLetterText = "comma";
        break;
      case ".":
        currentLetterText = "period";
        break;
      case "/":
        currentLetterText = "fdsh";
        break;
      case "?":
        currentLetterText = "qmrk";
        break;
      default:
        currentLetterText = character;
        break;
    }

    let keyToProcess = document
      .getElementById("keyboard")
      .querySelector(`#${currentLetterText}`);
    if (keyToProcess) {
      if (keyToProcess.nodeName === "SPAN") {
        keyToProcess = keyToProcess.parentElement;
      }
      if (event === "active") {
        keyToProcess.classList.add("active");
      } else if (event === "inactive") {
        if (keyToProcess.classList.contains("active")) {
          keyToProcess.classList.remove("active");
        }
      }
    }
    handsToProcess(currentLetterText);

    return;
  }

  function handleUserInput(e) {
    let isValidSpace = false;
    let currentWord = document.querySelector("ul.current");
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
      e.data === currentLetter.textContent || //validating for letter
      isValidSpace || // validating for space
      (e.data === "'" && // validating for single quote character
        (currentLetter.textContent === "’" ||
          currentLetter.textContent === "'"))
    ) {
      let prevLetterText = currentLetter.innerHTML;
      if (!currentLetter.classList.contains("incorrect")) {
        // validation for re-type
        currentLetter.classList.add("correct");
      }
      if (currentWord.nextSibling || currentLetter.nextSibling) {
        currentLetter.classList.remove("current");
        if (currentLetter.nextSibling) {
          // if letter still present in the word
          currentLetter.nextSibling.classList.add("current");
        } else {
          // move to next word
          currentWord.classList.remove("current");
          currentWord.nextSibling.classList.add("current");
          currentWord.nextSibling.firstChild.classList.add("current");
          currentWord = document.querySelector("ul.current"); // re-initialize current word
        }
        currentLetter = document.querySelector("li.current"); // re-initialize current letter
        let currentLetterText = currentLetter.innerHTML;
        activeInactiveKeys(prevLetterText.toLocaleLowerCase(), "inactive");
        activeInactiveKeys(currentLetterText.toLocaleLowerCase(), "active");
        // move cursor to next letter
        moveCursor(currentLetter, initialCursorPosLeft, initialCursorPosTop);

        // clear input field on space
        if (isValidSpace) {
          userInputField.value = "";
          isValidSpace = false;
        }
      } else {
        activeInactiveKeys(prevLetterText.toLocaleLowerCase(), "inactive");
        currentLetter.classList.remove("current");
        currentLetter = null;
        endTime = new Date().getTime();
        gameOver(startTime, endTime);
      }
    } else {
      currentLetter.classList.add("incorrect");
    }
  }

  // Adding each character into html element
  function createLetterElem(letter, letterId) {
    const letterElem = document.createElement("li"); // create li element
    letterElem.id = letterId;
    letterElem.classList.add("letter");
    if (!letterId) {
      letterElem.classList.add("current");
    }
    letterElem.innerHTML = letter;
    return letterElem;
  }

  // Split sentence into characters
  function getChars(sentence) {
    return sentence
      .split("")
      .map((character) =>
        character !== " "
          ? isCharAllowed
            ? character
            : character.toLowerCase()
          : "&nbsp;"
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

  // function to convert sentence to inidividual character
  function sentenceToChar(sentence) {
    const fragment = document.createDocumentFragment();
    // extract array of valid chars from sentence
    const lettersList = getChars(sentence);
    //insert each char into document within li element
    if (wordsContainer) {
      let wordElem = document.createElement("ul"); // create ul element for word
      wordElem.classList.add("word");
      lettersList.forEach((letter, index) => {
        if (!index) {
          // if first letter => first word
          wordElem.classList.add("current");
        }
        if (letter !== "&nbsp;") {
          wordElem.appendChild(createLetterElem(letter, index));
        } else {
          fragment.appendChild(wordElem); // add word to fragment
          wordElem = document.createElement("ul"); // create new ul element
          wordElem.classList.add("word");
          const spaceContainer = document.createElement("ul"); // create ul element for space
          const spaceElem = document.createElement("li");
          spaceElem.ariaLabel = "space";
          spaceElem.id = index;
          spaceElem.classList.add("letter");
          spaceElem.innerHTML = letter;
          spaceContainer.appendChild(spaceElem);
          fragment.appendChild(spaceContainer);
        }
      });
      fragment.appendChild(wordElem);
      wordsContainer.appendChild(fragment);
    }
  }

  // store sentence to localStorage from fetch
  async function storeSentence() {
    let toRetry = false;
    if (sessionStorage.getItem("quotes") !== null) {
      sessionStorage.removeItem("quotes");
    }
    do {
      const quote = await fetchSentence();
      if (quote) {
        toRetry = false;
        sessionStorage.setItem("quotes", JSON.stringify(quote));
      } else {
        toRetry = true;
        noTimesCalled++;
      }
    } while (toRetry && noTimesCalled < 4); // limit api call
  }

  // toggle 'character' button
  function charToggle(toActivate) {
    const charCheckbox = document.querySelector("#switch-char");
    if (charCheckbox) {
      charCheckbox.querySelector("input").disabled = toActivate; // enable/disable character toggle
      const charCheckboxSlider = charCheckbox.querySelector("span.slider");
      if (!toActivate) {
        if (charCheckboxSlider.classList.contains("inactive")) {
          charCheckboxSlider.classList.remove("inactive");
          charCheckboxSlider.classList.add("active");
        }
      } else {
        if (charCheckboxSlider.classList.contains("active")) {
          charCheckboxSlider.classList.remove("active");
          charCheckboxSlider.classList.add("inactive");
        }
      }
    }
    return;
  }

  // Get sentence from localStorage
  function getSentence() {
    const quotesList = JSON.parse(sessionStorage.getItem("quotes"));
    if (quotesList && sentenceIndex < quotesList.length) {
      charToggle(false); // enable character toggle
      const quoteObj = quotesList[sentenceIndex++];
      sessionStorage.setItem("sentenceTrack", sentenceIndex);
      return quoteObj.quote;
    }
  }

  // start game by clearing test sentence except blink cursor
  function startGame() {
    // reset variables
    isFirstCharTyped = false;
    startTime = 0;
    (initialCursorPosLeft = 0), (initialCursorPosTop = 0);
    endTime = 0;

    // deactivate any active key from keyboard layout
    const activeKey = document
      .getElementById("keyboard")
      .querySelector(".active");
    if (activeKey) {
      activeKey.classList.remove("active");
    }

    // disable user input field
    if (userInputField) {
      userInputField.disabled = false;
      userInputField.value = null;
      userInputField.focus();
    }

    // reset test sentence element
    if (wordsContainer) {
      const blinkCursor = wordsContainer.firstElementChild; // copy an instance of letter tracker
      wordsContainer.replaceChildren(); // clear if sentence already exists
      if (blinkCursor) {
        wordsContainer.appendChild(blinkCursor); // add letter tracker element
        blinkCursor.style.display = "inline";
        blinkCursor.style.left = "-5px";
        blinkCursor.style.top = "0px";
      }
    }
  }

  // main function starts here
  function newGame() {
    isAborted = false;
    let sentence;

    // initialize game;
    startGame(); // will be called for every new game

    // Get sentence
    sentence = getSentence();
    if (!sentence) {
      charToggle(true); // disable character toggle
      sentence = FB_SENTENCE; // initialize fallback sentence
      sentenceIndex = 0;
      sessionStorage.setItem("sentenceTrack", sentenceIndex);
      storeSentence();
    }

    // convert sentence to individual chars
    sentenceToChar(sentence);

    let currentLetter = document.querySelector("li.current");
    let currentLetterText = currentLetter.innerHTML;
    activeInactiveKeys(currentLetterText.toLocaleLowerCase(), "active");

    // initialize cursor position
    initialCursorPosLeft = parseInt(
      document.getElementById("letter-tracker").getBoundingClientRect().left
    );
    initialCursorPosTop = parseInt(
      document.getElementById("letter-tracker").getBoundingClientRect().top
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
