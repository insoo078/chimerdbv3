<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
   "http://www.w3.org/TR/html4/loose.dtd">

<html>
    <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>JSP Page</title>
       <link type="text/css" rel="stylesheet" href="./resources/css/ideogram/ideogram.css"/>
       <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js"></script>
       <script type="text/javascript" src="./resources/js/ideogram/ideogram.js"></script>
    </head>
    <body>
         <h1>Human | Ideogram</h1>
  <a href=".">Back to overview</a>
  <script type="text/javascript">
    var ideogram = new Ideogram({
      organism: "human"
    });
    
    console.log( ideogram );

  </script>
    </body>
</html>
