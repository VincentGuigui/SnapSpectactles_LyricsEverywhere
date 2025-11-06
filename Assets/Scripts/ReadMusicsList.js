//import * as fs from 'LensStudio:FileSystem';

//@input Component.Image coverImage
//@input Component.Text coverTitle

const musicsList = [
{"title":"Birthday Song","cover":"birthday song.jpg"},
{"title":"Crazy People","cover":"crazy people.jpg"},
{"title":"Crowded City","cover":"crowded city.jpg"},
{"title":"Family Time","cover":"family time.jpg"},
{"title":"Flying through the sky","cover":"flying through the sky.jpg"},
{"title":"Sunshine Dance","cover":"SunshineDance_3m45.jpg"},
{"title":"Light in the Night","cover":"light in the night.jpg"}
];

let coverIndex = 1;


// --- UI State Updates ---
function updateCoverFlow() {
    console.log("coverIndex", coverIndex)
//    script.coverImage.mainMaterial.texture = musicsList[coverIndex].cover;
    script.coverTitle.text = musicsList[coverIndex].title;
}

updateCoverFlow();

function next() {
    console.log("next")
    coverIndex = coverIndex + 1;
    if (coverIndex > musicsList.length) {
        coverIndex = 0;
    }
    updateCoverFlow();
}

function previous(){
    coverIndex = coverIndex - 1;
    if (coverIndex < 0) {
        coverIndex = musicsList.length - 1;
    }
    updateCoverFlow();

}
