const path = require('path');

const root = path.join(__dirname, '../..');

const paths = {
    images: path.join(root, 'assets', 'images'),
    videos: path.join(root, 'assets', 'videos'),
    audios: path.join(root, 'assets', 'audios'),
    subtitles: path.join(root, 'assets', 'audios'),
    fonts: path.join(root, 'assets', 'fonts'),
    output: path.join(root, 'output'),
    tmp: path.join(root, 'tmp'),
};

module.exports = {
    paths,
    getImageFile: (image) => path.join(paths.images, image),
    getImageFile: (video) => path.join(paths.videos, video),
    getAudioFile: (audio) => path.join(paths.audios, audio),
    getSubsFile: (subs) => path.join(paths.subtitles, subs),
    getFontFile: (font) => path.join(paths.fonts, font),
    firstImages: ['image1.jpeg', 'image2.jpeg', 'image3.jpeg', 'image4.jpeg', 'image5.jpeg', 'image6.jpeg'],
    firstVideos: ['intro.mp4'],
    lastVideos: []
};