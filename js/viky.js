document.addEventListener('DOMContentLoaded', () => {
    // Screen elements
    const screen1 = document.getElementById('screen1-intro');
    const screen2 = document.getElementById('screen2-love-question');
    const screen3 = document.getElementById('screen3-apology');
    const screen4 = document.getElementById('screen4-flowers');

    // Elements for screen 1
    const introTextElement = screen1.querySelector('.intro-text');
    const introMessage = "From Bubu to Bebe...";

    // Elements for screen 2
    const loveYesButton = document.getElementById('love-yes');
    const loveNoButton = document.getElementById('love-no');

    // Elements for screen 3
    const apologyTextLine1Element = screen3.querySelector('.apology-text-line1');
    const apologyTextLine2Element = screen3.querySelector('.apology-text-line2');
    const apologyMessageL1 = "Han is sorry for sometimes being a 'hnidopich'...";
    const apologyMessageL2 = "...but he loves you so much and wants to make it up to you!";
    const movingButton = document.getElementById('accept-present-button');
    const movingButtonContainer = screen3.querySelector('.moving-button-container');
    const acceptPresentText = screen3.querySelector('.accept-present-text');

    // Typing speed
    const typingSpeed = 70; // Milliseconds per character

    // Function to switch screens
    function showScreen(screenToShow) {
        [screen1, screen2, screen3, screen4].forEach(s => {
            s.classList.remove('active');
        });
        screenToShow.classList.add('active');
    }

    // Typing animation function
    function typeText(element, text, speed, addCursor, callback) {
        element.innerHTML = "";
        let i = 0;
        let cursorSpan = null;

        if (addCursor) {
            cursorSpan = document.createElement('span');
            cursorSpan.className = 'typed-cursor';
            element.appendChild(cursorSpan);
        }

        function typing() {
            if (i < text.length) {
                if (addCursor && cursorSpan) {
                    element.insertBefore(document.createTextNode(text.charAt(i)), cursorSpan);
                } else {
                    element.innerHTML += text.charAt(i);
                }
                i++;
                setTimeout(typing, speed);
            } else {
                if (addCursor && cursorSpan) {
                    setTimeout(() => { if (cursorSpan) cursorSpan.remove(); }, 500);
                }
                if (callback) {
                    callback();
                }
            }
        }
        typing();
    }

    // Screen 1 Logic
    function initScreen1() {
        if (!introTextElement) {
            console.error("Error: introTextElement not found!");
            return;
        }
        typeText(introTextElement, introMessage, typingSpeed, true, () => {
            setTimeout(() => {
                showScreen(screen2);
            }, 2000);
        });
    }

    // Screen 2 Logic
    if (loveYesButton) {
        loveYesButton.addEventListener('click', () => {
            showScreen(screen3);
            initScreen3();
        });
    } else {
        console.error("loveYesButton not found");
    }

    if (loveNoButton) {
        loveNoButton.addEventListener('click', () => {
            loveNoButton.textContent = "Oh no you don't! 😉";
            loveNoButton.disabled = true;
            loveNoButton.style.transition = 'transform 0.1s';
            let shakes = 0;
            const interval = setInterval(() => {
                loveNoButton.style.transform = `translateX(${shakes % 2 === 0 ? 5 : -5}px)`;
                shakes++;
                if (shakes > 5) {
                    clearInterval(interval);
                    loveNoButton.style.transform = 'translateX(0)';
                }
            }, 100);
        });
    } else {
        console.error("loveNoButton not found");
    }

    // Screen 3 Logic
    function initScreen3() {
        if (!apologyTextLine1Element || !apologyTextLine2Element || !acceptPresentText || !movingButton) {
            console.error("One or more elements for screen 3 not found!");
            return;
        }
        apologyTextLine1Element.textContent = '';
        apologyTextLine2Element.textContent = '';
        acceptPresentText.style.opacity = '0';
        movingButton.style.display = 'inline-block'; // Show button immediately

        typeText(apologyTextLine1Element, apologyMessageL1, typingSpeed, true, () => {
            typeText(apologyTextLine2Element, apologyMessageL2, typingSpeed, true, () => {
                acceptPresentText.style.transition = 'opacity 0.5s ease-in';
                acceptPresentText.style.opacity = '1';
            });
        });
    }

    // Screen 3 Button Click
    if (movingButton) {
        movingButton.addEventListener('click', () => {
            movingButton.style.animation = 'none'; // Stop animation
            movingButton.textContent = "Caught me! 😍";
            setTimeout(() => {
                showScreen(screen4);
            }, 1000);
        });
    } else {
        console.error("movingButton not found");
    }

    // Start the sequence
    if (screen1 && introTextElement) {
        showScreen(screen1);
        initScreen1();
    } else {
        console.error("Initial screen (screen1) or introTextElement not found. Page cannot start.");
    }
});
