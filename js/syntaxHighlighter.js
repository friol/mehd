/* poor man's syntax highlighter with LUA syntax */

class syntaxHighlighter
{
    constructor()
    {
        this.baseColor=0;
        this.commentColor=1;
        this.reservedWordColor=2;
        this.libFunctionColor=3;
        this.operatorsColor=4;
        this.stringColor=5;
        this.numberColor=6;

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
            " pset","pset",
            " color","color ","color",
            " flip","flip ","flip",
            " cls","cls ","cls", "add", "add",
            " rnd","rnd"," flr","flr", " abs","abs",
            " max","max"," bxor","bxor"," min","min",
            " sqrt","sqrt", " atan2","atan2",
            "logprint"
        ];

        this.operatorsWords=[
            "=",">=","<=","!=",">","<"
        ];
    }

    findNumbers(str,posArray)
    {
        var state=0; // 0 number start, 1 number end
        var parstart,parend;
        var atLeastOneFound=false;

        for (var i=0;i<str.length;i++)
        {
            if (((str[i]>='0')&&(str[i]<='9'))||(str[i]=='.'))
            {
                atLeastOneFound=true;
                if (state==0)
                {
                    parstart=i;
                    state=1;
                }
            }
            else
            {
                if (state==1)
                {
                    state=0;
                    parend=i-1;
                    posArray.push([parstart,parend,this.numberColor]);
                }
            }
        }

        if (state==1)
        {
            posArray.push([parstart,str.length-1,this.numberColor]);
        }

        return atLeastOneFound;
    }

    findQuotedStrings(str,posArray)
    {
        var state=0; // 0 closed, 1 opened
        var parstart,parend;
        var atLeastOneFound=false;

        for (var i=0;i<str.length;i++)
        {
            if (str[i]=='"')
            {
                atLeastOneFound=true;
                if (state==0)
                {
                    parstart=i;
                    state=1;
                }
                else if (state==1)
                {
                    parend=i;
                    posArray.push([parstart,parend,this.stringColor]);
                    state=0;
                }
            }
        }

        if (state==1)
        {
            posArray.push([parstart,str.length-1,this.stringColor]);
        }

        return atLeastOneFound;
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

        // find operators
        for (var kw=0;kw<this.operatorsWords.length;kw++)
        {
            const indexes = [...str.matchAll(new RegExp(this.operatorsWords[kw], 'gi'))].map(a => a.index);
            if (indexes.length>0)
            {
                atLeastOneFound=true;
                for (var i=0;i<indexes.length;i++)
                {
                    rezult.push([indexes[i],indexes[i]+this.operatorsWords[kw].length-1,this.operatorsColor]);
                }                    
            }
        }

        // find double quoted strings

        var stringsFound=this.findQuotedStrings(str,rezult);
        var numbersFound=this.findNumbers(str,rezult);

        if (atLeastOneFound || stringsFound || numbersFound) return rezult;

        return [[0,str.length-1,this.baseColor]];

    }

}
