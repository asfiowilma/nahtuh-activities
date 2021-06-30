var canvas = document.getElementById('canvas');
var username = '';
var eventId = '';
var isHost = false;
var playerList = [];

const Colors = {
    aqua: "#00ffff",
    azure: "#f0ffff",
    beige: "#f5f5dc",
    black: "#000000",
    green: "#0000ff",
    brown: "#a52a2a",
    cyan: "#00ffff",
    darkgreen: "#00008b",
    darkcyan: "#008b8b",
    darkgrey: "#a9a9a9",
    darkgreen: "#006400",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkviolet: "#9400d3",
    fuchsia: "#ff00ff",
    gold: "#ffd700",
    green: "#008000",
    indigo: "#4b0082",
    khaki: "#f0e68c",
    lightgreen: "#add8e6",
    lightcyan: "#e0ffff",
    lightgreen: "#90ee90",
    lightgrey: "#d3d3d3",
    lightpink: "#ffb6c1",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    magenta: "#ff00ff",
    maroon: "#800000",
    navy: "#000080",
    olive: "#808000",
    orange: "#ffa500",
    pink: "#ffc0cb",
    purple: "#800080",
    violet: "#800080",
    red: "#ff0000",
    silver: "#c0c0c0",
    white: "#ffffff",
    yellow: "#ffff00"
};

yai.onEventVariableChanged = onEventVarChange
yai.onParticipantJoined = onPlayerJoin

const GameScene = new function(){
    let myBox = document.createElement('div');
    myBox.className = 'myBox';

    this.start = () => {
        this.renderMyBox();
        this.renderOtherBox();

        window.addEventListener('keydown', this.keyListener);
    }

    this.onPlayerJoin = () => {
        this.renderOtherBox();
    }

    this.onEventVarChange = (name, value) => {
        this.rerenderOtherBox(name, value);
    }

    this.keyListener = ({keyCode}) => {
        switch(keyCode){
            case 40:
                yai.eventVars[username] = {
                    ...yai.eventVars[username], 
                    positionY: yai.eventVars[username].positionY + 10};
                this.rerenderMyBox();
                break;
            case 37:
                yai.eventVars[username] = {
                    ...yai.eventVars[username], 
                    positionX: yai.eventVars[username].positionX - 10};
                this.rerenderMyBox();
                break;
            case 38:
                yai.eventVars[username] = {
                    ...yai.eventVars[username], 
                    positionY: yai.eventVars[username].positionY - 10};
                this.rerenderMyBox();
                break;
            case 39:
                yai.eventVars[username] = {
                    ...yai.eventVars[username], 
                    positionX: yai.eventVars[username].positionX + 10};
                this.rerenderMyBox();
                break;
        }
    }

    this.renderMyBox = () => {
        myBox.style.width = '50px';
        myBox.style.height = '50px';
        myBox.style.backgroundColor = this.getMyColor(username);
        myBox.style.position = 'absolute';
        myBox.style.top = `${this.getMyPosition(username).y}px`;
        myBox.style.left = `${this.getMyPosition(username).x}px`;

        canvas.appendChild(myBox);
    }

    this.rerenderMyBox = () => {
        myBox.style.top = `${this.getMyPosition(username).y}px`;
        myBox.style.left = `${this.getMyPosition(username).x}px`;
    }

    this.renderOtherBox = () => {
        playerList.forEach(player => {
            if(player.participantName !== username){
                let newBox = document.createElement('div');
                newBox.id = player.participantName;
                newBox.style.width = '50px';
                newBox.style.height = '50px';
                newBox.style.backgroundColor = this.getMyColor(player.participantName);
                newBox.style.position = 'absolute';
                newBox.style.top = `${this.getMyPosition(player.participantName).y}px`;
                newBox.style.left = `${this.getMyPosition(player.participantName).x}px`;
    
                canvas.appendChild(newBox)
            }
        });
    }

    this.rerenderOtherBox = (name, value) => {
        let tempBox = document.getElementById(name);

        tempBox.style.width = '50px';
        tempBox.style.height = '50px';
        tempBox.style.backgroundColor = this.getMyColor(name);
        tempBox.style.position = 'absolute';
        tempBox.style.top = `${value.positionY}px`;
        tempBox.style.left = `${value.positionX}px`;
    }

    this.getMyColor = (username) => {
        let isInitiated = false;
        if(yai.eventVars[username]){
            isInitiated = true;
        }
        
        return isInitiated ? yai.eventVars[username].color : 'green';
    }

    this.getMyPosition = (username) => {
        let isInitiated = false;
        if(yai.eventVars[username]){
            isInitiated = true;
        }

        return {
            x: isInitiated ? yai.eventVars[username].positionX : 0,
            y: isInitiated ? yai.eventVars[username].positionY : 0
        }
    }

    this.generateStyle = () => {
        addStyle(`
            .canvas{
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .myBox{
                width: 50px;
                height: 50px;
                background-color: ${this.getMyColor(username)};
                position: absolute;
                top: ${this.getMyPosition(username).y}px;
                left: ${this.getMyPosition(username).x}px;
            }
        `)
    }
}

async function initializeBox(){
    username = new URLSearchParams(window.location.search).get('username');
    eventId = new URLSearchParams(window.location.search).get('eventid');
    isHost = (new URLSearchParams(window.location.search).get('ishost') === 'true');

    let loginResponse = await identityManager.login(username, 'sadsad');

    if(isHost){
        let createEventResponse = 
            await yai.createEvent('X01', '', username, '', loginResponse.accessToken);
        console.log(createEventResponse)
        yai.eventVars[username] = {
            username,
            positionX: 0,
            positionY: 0,
            color: getRandomColor()
        }
        console.log(yai.eventVars);
    }else{
        let joinEventResponse =
            await yai.join(eventId, username, '');
        console.log(joinEventResponse);
        yai.eventVars[username] = {
            username,
            positionX: 0,
            positionY: 0,
            color: getRandomColor()
        }
    }

    playerList = await yai.getParticipantList();

    GameScene.start();
}

function onEventVarChange(message){
    console.log(message);
    console.log(yai.eventVars);
    GameScene.onEventVarChange(message.name, message.value);

}

function onPlayerJoin(message){
    playerList.push(message);
    GameScene.onPlayerJoin();
}

function getRandomColor() {
    var result;
    var count = 0;
    for (var prop in Colors)
        if (Math.random() < 1/++count)
           result = prop;
    return result;
};

//add style element to the html
const addStyle = (() => {
    const style = document.createElement('style');
    document.head.append(style);
    return (styleString) => style.textContent = styleString;
})();

initializeBox();