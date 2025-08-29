import React, { useState, useEffect } from "react";
import { Card, Row, Col, Divider } from "antd";
import ReplacementSettings from "./components/ReplacementSettings";
import ReplacementRequestsTable from "./components/ReplacementRequestsTable";

const MaterialReplacement = () => {
  return (
    <div className="material-replacement-page">
      <h1 style={{ marginBottom: 24, fontSize: 24, fontWeight: "bold" }}>
        Замена материалов
      </h1>

      <Row gutter={[0, 24]}>
        <Col span={24}>
          <ReplacementSettings />
        </Col>

        <Col span={24}>
          <ReplacementRequestsTable />
        </Col>
      </Row>
    </div>
  );
};

export default MaterialReplacement;
