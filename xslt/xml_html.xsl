<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:output method="html"/>

    <xsl:template match="/">
        <html>
        <head>
            <title>XML to HTML Report</title>
            <style>
                table { border-style: ridge; width: 100%; }
                th, td { 
                        border: 1px solid #ccc; 
                        padding: 8px; 
                        
                        }
                th {
                    background-color:#e65348;
                    color:white;
                    padding:20px
                }
            </style>
        </head>
        <body style="font-family:Arial;font-size:12pt;background-color:#EEEEEE">
            <h2>XML to HTML Report</h2>

            <table>
                <!-- Generate table headers dynamically -->
                <thead>
                    <tr>
                        <xsl:for-each select="/*/*[1]/*">
                            <th><xsl:value-of select="name()"/></th>
                        </xsl:for-each>
                    </tr>
                </thead>

                <!-- Generate table rows dynamically -->
                <tbody>
                    <xsl:for-each select="/*/*">
                        <tr>
                            <xsl:for-each select="*">
                                <td><xsl:value-of select="."/></td>
                            </xsl:for-each>
                        </tr>
                    </xsl:for-each>
                </tbody>
            </table>
        </body>
        </html>
    </xsl:template>

    

</xsl:stylesheet>

