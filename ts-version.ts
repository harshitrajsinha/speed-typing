import getHands from "./src/hands.js";

window.addEventListener("load", function () {
  console.log("DOM is loaded");

  const FB_SENTENCE = `type this line to find out how many words per minute or wpm you can type`; // fallback sentence in case quotes is not fetched
  const SERVER_API_URL = `https://my-server-raj-sinha.vercel.app/api/quotes/v1/quotes`;
  const TIMEOUT_DURATION = 10000;

  let noTimesCalled = 0; // no of times API request is made
  let userInputField = document.querySelector(
    "div#user-input input"
  ) as HTMLInputElement;
  let wordsContainer = document.getElementById(
    "words-container"
  ) as HTMLDivElement;
  let audio = document.getElementById("windy-hill-music");
  let isCharAllowed = true;
  let isFirstCharTyped: boolean;
  let startTime: number,
    initialCursorPosLeft: number,
    initialCursorPosTop: number,
    endTime: number;
  let isAborted = false;
  let sentenceIndex = 0; // keeps track of current sentence fetched from localStorage
  // const leftCursor = window
  //   .getComputedStyle(document.getElementById("letter-tracker"))
  //   .getPropertyValue("left");
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
  async function fetchSentence(): Promise<object | null> {
    let timeoutId: number | null = null;
    try {
      const controller = new AbortController(); // Abort controller to timeout API request
      if (!timeoutId) {
        timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION); // abort the request after 10 seconds of calling fetchSentence()
      }
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
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const data: object = await response.json();

        if (data) {
          return data["quotes"];
        } else {
          return null;
        }
      } else {
        throw new Error("Response is not JSON");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.log("Request timed out");
        return null;
      } else {
        console.error("Error occured", error.message);
        return null;
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId); // cleartimeout if request is successfull or failed withing given delay
        timeoutId = null;
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
    const leftHand = document.getElementById("left");
    const rightHand = document.getElementById("right");
    if (leftHand) {
      leftHand.replaceChildren();
    }
    if (rightHand) {
      rightHand.replaceChildren();
    }
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
  function moveletterTracker(
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

  function createImageElem(attributes: [string, string]) {
    const imgElem = document.createElement("img");
    imgElem.src = attributes[0];
    imgElem.classList.add(attributes[1]);
    return imgElem;
  }

  // function to show hands as per key
  function handsToProcess(key: string) {
    const { leftHand, rightHand } = getHands(key);
    document.getElementById("left")!.replaceChildren();
    document.getElementById("right")!.replaceChildren();
    document.getElementById("left")!.append(createImageElem(leftHand));
    document.getElementById("right")!.append(createImageElem(rightHand));
  }

  // Function to highlight keyboard keys
  function activeInactiveKeys(character: string, event: "active" | "inactive") {
    // Character-to-ID mapping
    const charToIdMap: Record<string, string> = {
      "&nbsp;": "key-space",
      ":": "colon",
      ";": "smcln",
      "'": "snqt",
      "’": "snqt",
      '"': "dbqt",
      ",": "comma",
      ".": "period",
      "/": "fdsh",
      "?": "qmrk",
    };

    // Get corresponding ID or fallback to the character itself
    const currentLetterText = charToIdMap[character] || character;

    let keyToProcess = document
      .getElementById("keyboard")!
      .querySelector(`#${currentLetterText}`);
    if (!keyToProcess) {
      console.error(`Key element not found for: "${currentLetterText}"`);
      return;
    }

    // If the selected element is a SPAN, get its parent
    if (keyToProcess.nodeName === "SPAN") {
      keyToProcess = keyToProcess.parentElement;
      if (!keyToProcess) {
        console.error(`Parent element missing for: "${currentLetterText}"`);
        return;
      }
    }

    // Toggle key classes based on event type
    if (event === "active") {
      keyToProcess.classList.add("active");
    } else if (event === "inactive") {
      if (keyToProcess.classList.contains("active")) {
        keyToProcess.classList.remove("active");
      }
    }

    // Handle additional processing for the key
    handsToProcess(currentLetterText);
  }

  function handleUserInput(e) {
    let isValidSpace = false;
    let currentWord = document.querySelector("ul.current");
    let currentLetter = document.querySelector("li.current");
    if (!isFirstCharTyped) {
      startTime = new Date().getTime(); // start timer
      isFirstCharTyped = true;
    }

    // check if space character
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
        moveletterTracker(
          currentLetter,
          initialCursorPosLeft,
          initialCursorPosTop
        );

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
  function createLetterElem(letter: string, letterId: number): HTMLLIElement {
    const letterElem = document.createElement("li"); // create li element
    letterElem.id = String(letterId);
    letterElem.classList.add("letter");
    if (!letterId) {
      letterElem.classList.add("current");
    }
    letterElem.innerHTML = letter;
    return letterElem;
  }

  function createSpaceElem(letter: string, index: number): HTMLUListElement {
    const spaceContainer = document.createElement("ul"); // Create UL element for space
    const spaceElem = document.createElement("li");

    Object.assign(spaceElem, {
      ariaLabel: "space",
      id: index.toString(),
      innerHTML: letter,
    });

    spaceElem.classList.add("letter");
    spaceContainer.appendChild(spaceElem);

    return spaceContainer;
  }

  function createWordElem(): HTMLUListElement {
    const wordElem = document.createElement("ul");
    wordElem.classList.add("word");
    return wordElem;
  }

  // Split sentence into characters
  function getChars(sentence: string): string[] {
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

  // function to convert sentence to inidividual words

  function sentenceToWords(sentence: string): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const lettersList: string[] = getChars(sentence);

    if (!wordsContainer) {
      console.error("Could not convert to characters");
      return fragment;
    }

    let wordElem: HTMLUListElement = createWordElem(); // create ul element for word

    lettersList.forEach((letter, index) => {
      if (index === 0) {
        wordElem.classList.add("current"); // Mark first word
      }

      if (letter === "&nbsp;") {
        fragment.appendChild(wordElem); // Append word to fragment
        fragment.appendChild(createSpaceElem(letter, index));
        wordElem = createWordElem(); // Create new word <ul>
      } else {
        wordElem.appendChild(createLetterElem(letter, index));
      }
    });

    fragment.appendChild(wordElem); // Append last word
    return fragment;
  }

  // store sentence to localStorage from fetch
  async function storeSentence(): Promise<void> {
    let toRetry = false;
    if (!sessionStorage.getItem("quotes")) {
      // to fetch new sentences
      sessionStorage.removeItem("quotes");
    }
    do {
      const quote: object = await fetchSentence();
      if (quote) {
        toRetry = false;
        sessionStorage.setItem("quotes", JSON.stringify(quote));
      } else {
        toRetry = true;
        noTimesCalled++;
      }
    } while (toRetry && noTimesCalled < 4); // limit api call and retry fetch
  }

  // toggle 'character' switch button
  function charToggle(toActivate: boolean): void {
    const charCheckbox = document.querySelector(
      "#switch-char"
    ) as HTMLDivElement;
    if (charCheckbox) {
      charCheckbox.querySelector("input")!.disabled = toActivate; // enable/disable character toggle
      const charCheckboxSlider = charCheckbox.querySelector("span.slider")!; // assuming slider class to exists since char toggle exists
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
    } else {
      console.error("Character toggle button is not defined");
    }
    return;
  }

  // Get sentence from localStorage
  function getSentence(): string | null {
    const quotesInString = sessionStorage.getItem("quotes");
    if (quotesInString) {
      const quotesList: [object] = JSON.parse(quotesInString);
      if (quotesList && sentenceIndex < quotesList.length) {
        charToggle(false); // enable character toggle
        const quoteObj: object = quotesList[sentenceIndex++];
        sessionStorage.setItem("sentenceTrack", String(sentenceIndex));
        return quoteObj["quote"];
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  // start game by clearing test sentence except blink cursor
  function startGame(): void {
    // reset variables
    isFirstCharTyped = false;
    startTime = 0;
    (initialCursorPosLeft = 0), (initialCursorPosTop = 0);
    endTime = 0;

    // deactivate any active key from keyboard layout
    const activeKeys = document
      .getElementById("keyboard")!
      .querySelectorAll(".active");
    if (activeKeys.length) {
      activeKeys.forEach((key) => {
        key.classList.remove("active");
      });
    }

    // disable user input field
    if (userInputField) {
      userInputField.disabled = false;
      userInputField.value = "";
      userInputField.focus();
    } else {
      console.error("user input field is not defined");
    }

    // reset test sentence element
    if (wordsContainer) {
      const blinkCursor =
        wordsContainer.firstElementChild as HTMLDivElement | null; // copy an instance of letter tracker
      wordsContainer.replaceChildren(); // clear if sentence/letters already exists
      if (blinkCursor) {
        wordsContainer.appendChild(blinkCursor); // add letter tracker element
        blinkCursor.style.display = "inline";
        blinkCursor.style.left = "-5px";
        blinkCursor.style.top = "0px";
      }
    }
  }

  // main function starts here
  function newGame(): void {
    isAborted = false;
    let sentence: string | null;

    // initialize game;
    startGame(); // will be called for every new game

    // Get sentence
    sentence = getSentence();
    if (!sentence) {
      charToggle(true); // disable character toggle
      sentence = FB_SENTENCE; // initialize fallback sentence
      sentenceIndex = 0;
      sessionStorage.setItem("sentenceTrack", String(sentenceIndex));
      storeSentence(); // try to fetch sentence from server
    }

    // convert sentence to individual chars
    const sentenceElem = sentenceToWords(sentence);
    wordsContainer.appendChild(sentenceElem);

    let currentLetter = document.querySelector("li.current")!;
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

    return;
  }

  newGame();
});
