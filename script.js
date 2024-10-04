// script.js
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messagesContainer = document.querySelector('.messages');

sendButton.addEventListener('click', () => {
    const message = messageInput.value;
    fetch('/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
    })
        .then((response) => response.json())
        .then((data) => {
            const messageElement = document.createElement('div');
            messageElement.textContent = data.message;
            messagesContainer.appendChild(messageElement);
            messageInput.value = '';
        })
        .catch((error) => console.error(error));
});

fetch('/messages')
    .then((response) => response.json())
    .then