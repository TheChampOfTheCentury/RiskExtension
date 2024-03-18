const createButton = document.getElementById("fnm:create");

createButton.addEventListener("click", async () => {
   let [tab] = await chrome.tabs.query({active : true, currentWindow: true});
   console.log(tab);

   chrome.scripting.executeScript({
    target : {tabId: tab.id},
    function : pickColor,
   }, async(injectionResults) => {

    const [data] = injectionResults;
    if(data.result){
        console.log("result! " + data.result);
    }
   });
});


async function pickColor(){
    try {
        const eyeDropper = new EyeDropper();
        return await eyeDropper.open();
        
    } catch (err) {
        console.log(err);
    }
}




// document.addEventListener('click', function(e) {
//     e = e || window.event;
//     var target = e.target;   
//     console.log(target + " click")
// }, false);