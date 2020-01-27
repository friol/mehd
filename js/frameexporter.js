/* frame exporter (.gif, etc) */

class frameExporter
{
    constructor(canvasName)
    {
        this.started=false;
        this.canvasName=canvasName;
        this.capturer = new CCapture( { framerate: 30, verbose: false, format: 'gif', workersPath: 'js/lib/' } );
        //this.capturer = new CCapture( { framerate: 60, verbose: false, format: 'webm' } );
    }

    start()
    {
        this.capturer.start();
        this.started=true;
    }

    endAndSave()
    {
        this.started=false;
        this.capturer.stop();
        this.capturer.save();
    }
}
