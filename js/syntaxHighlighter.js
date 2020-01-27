/* poor man's syntax highlighter with LUA syntax */

class syntaxHighlighter
{
    constructor()
    {
        this.baseColor=0;
        this.commentColor=1;
        this.reservedWordColor=2;
        this.libFunctionColor=3;

        // I said this was poor man's...
        this.reservedWords=[" for","for ",
            "do "," do",
            " function","function ",
            " if","if ",
            " else","else ","else",
            " then","then ","then",
            " end","end ","end",
            " goto","goto ",
        ];

        this.libFunctionWords=[
            " sin","sin ","sin",
            " cos","cos ","cos",
            " line","line ","line",
            " rectfill","rectfill ","rectfill",
            " circfill","circfill ","circfill",
            " color","color ","color",
            " flip","flip ","flip",
            " cls","cls ","cls",
            " rnd","rnd"," flr","flr", " abs","abs",
            " max","max"," bxor","bxor"," min","min",
            " sqrt","sqrt",
            "logprint"
        ];
    }

    highlight(str)
    {
        var rezult=new Array();

        // comment
        if ((str.length>=2)&&(str.substring(0,2)=="--"))
        {
            return [[0,str.length-1,this.commentColor]];
        }
        var atLeastOneFound=false;

        // find keywords
        for (var kw=0;kw<this.reservedWords.length;kw++)
        {
            const indexes = [...str.matchAll(new RegExp(this.reservedWords[kw], 'gi'))].map(a => a.index);
            if (indexes.length>0)
            {
                atLeastOneFound=true;
                for (var i=0;i<indexes.length;i++)
                {
                    rezult.push([indexes[i],indexes[i]+this.reservedWords[kw].length-1,this.reservedWordColor]);
                }                    
            }
        }

        // find library functions
        for (var kw=0;kw<this.libFunctionWords.length;kw++)
        {
            const indexes = [...str.matchAll(new RegExp(this.libFunctionWords[kw], 'gi'))].map(a => a.index);
            if (indexes.length>0)
            {
                atLeastOneFound=true;
                for (var i=0;i<indexes.length;i++)
                {
                    rezult.push([indexes[i],indexes[i]+this.libFunctionWords[kw].length-1,this.libFunctionColor]);
                }                    
            }
        }


        if (atLeastOneFound) return rezult;

        return [[0,str.length-1,this.baseColor]];

    }

}
