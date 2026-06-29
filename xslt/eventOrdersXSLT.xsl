<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

    <xsl:output method="xml" indent="yes"/>

    <xsl:template match="/">
        <EventOrders>
            <xsl:for-each select="EventOrders/EventOrder">
                <EventOrder>

                    <OrderInfo>
                        <ID><xsl:value-of select="OrderInfo/ID"/></ID>
                        <CustomerID><xsl:value-of select="OrderInfo/CustomerID"/></CustomerID>
                        <OrderDate><xsl:value-of select="OrderInfo/OrderDate"/></OrderDate>
                        <Status><xsl:value-of select="OrderInfo/Status"/></Status>
                    </OrderInfo>

                    <EventInfo>
                        <EventName><xsl:value-of select="EventInfo/EventName"/></EventName>
                        <EventDate><xsl:value-of select="EventInfo/EventDate"/></EventDate>
                        <EventType><xsl:value-of select="EventInfo/EventType"/></EventType>
                        <EventLocation><xsl:value-of select="EventInfo/EventLocation"/></EventLocation>
                    </EventInfo>

                    <AdminInfo>
                        <AdminNotes><xsl:value-of select="AdminInfo/AdminNotes"/></AdminNotes>
                        <CancellationReason><xsl:value-of select="AdminInfo/CancellationReason"/></CancellationReason>
                    </AdminInfo>

                </EventOrder>
            </xsl:for-each>
        </EventOrders>
    </xsl:template>

</xsl:stylesheet>

