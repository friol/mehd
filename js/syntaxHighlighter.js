/* poor man's syntax highlighter with LUA syntax */

class syntaxHighlighter
{
    constructor()
    {
        this.baseColor=0;
        this.commentColor=1;


        this.reservedWords=["for","do","function","if","else","then"];
    }

    highlight(str)
    {
        if ((str.length>=2)&&(str.substring(0,2)=="--"))
        {
            return [[0,str.length-1,this.commentColor]];
        }
        else
        {
            return [[0,str.length-1,this.baseColor]];
        }

    }

}
