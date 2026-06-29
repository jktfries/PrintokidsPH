<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:output method="xml" indent="yes"/>

    <xsl:template match="/">
        <Product>
            <xsl:for-each select="ProductsData/Product">
                <Item>
                    <ProductID><xsl:value-of select="id"/></ProductID>
                    <ProductName><xsl:value-of select="name"/></ProductName>
                    <Category><xsl:value-of select="category"/></Category>
                    <Cost><xsl:value-of select="base_cost"/></Cost>
                </Item>
            </xsl:for-each>
        </Product>
    </xsl:template>

</xsl:stylesheet>
