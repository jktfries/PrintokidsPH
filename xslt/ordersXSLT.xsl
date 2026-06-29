<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:output method="xml" indent="yes"/>

    <xsl:template match="/">
        <Orders>
            <xsl:for-each select="Orders/Order">
                <Order>

                    <OrderInfo>
                        <ID><xsl:value-of select="OrderInfo/ID"/></ID>
                        <CustomerID><xsl:value-of select="OrderInfo/CustomerID"/></CustomerID>
                        <EmployeeID><xsl:value-of select="OrderInfo/EmployeeID"/></EmployeeID>
                        <ShippingAddressID><xsl:value-of select="OrderInfo/ShippingAddressID"/></ShippingAddressID>
                        <OrderDate><xsl:value-of select="OrderInfo/OrderDate"/></OrderDate>
                        <Status><xsl:value-of select="OrderInfo/Status"/></Status>
                    </OrderInfo>

                    <PaymentInfo>
                        <TotalAmount><xsl:value-of select="PaymentInfo/TotalAmount"/></TotalAmount>
                        <PaymentMethod><xsl:value-of select="PaymentInfo/PaymentMethod"/></PaymentMethod>
                        <PaymentStatus><xsl:value-of select="PaymentInfo/PaymentStatus"/></PaymentStatus>
                        <ProofOfPaymentURL><xsl:value-of select="PaymentInfo/ProofOfPaymentURL"/></ProofOfPaymentURL>
                    </PaymentInfo>

                </Order>
            </xsl:for-each>
        </Orders>
    </xsl:template>

</xsl:stylesheet>

