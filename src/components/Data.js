import React, { useState, useEffect } from "react";
import { Button, Table, Dropdown, Form, ButtonGroup } from 'react-bootstrap';
import axios from 'axios';

function Data() {
    const [bikeRacks, setBikeRacks] = useState([]);
    const [expandedRack, setExpandedRack] = useState(null);
    const [rackCounts, setRackCounts] = useState({});
    const [selectedAssessment, setSelectedAssessment] = useState(null); // To store the selected assessment details
    const [filteredRacks, setFilteredRacks] = useState([]); // To store filtered bike racks
    const [filterBy, setFilterBy] = useState(''); // Store selected filter type (boroname, condition, etc.)
    const [filterValue, setFilterValue] = useState(''); // Store value for filtering

    console.log(bikeRacks)

    const toggleExpand = (rackId) => {
        setExpandedRack(expandedRack === rackId ? null : rackId);
        setSelectedAssessment(null); // Reset selected assessment when expanding/collapsing racks
    };

    useEffect(() => {
        const countOccurrences = bikeRacks.reduce((acc, rack) => {
            acc[rack.site_ID] = (acc[rack.site_ID] || 0) + 1;
            return acc;
        }, {});
        setRackCounts(countOccurrences);
    }, [bikeRacks]);

    const client = axios.create({
        baseURL: "http://127.0.0.1:8000/",
        withCredentials: true
    });

    const fetchBikeRackData = async () => {
        try {
            const response = await client.get('/create_assessment/');
            setBikeRacks(response.data);
            setFilteredRacks(response.data); // Initially display all bike racks
        } catch (error) {
            console.error('Error fetching bike rack data:', error);
        }
    };

    useEffect(() => {
        fetchBikeRackData();
    }, []);

    // Function to handle date click and display assessment details
    const handleDateClick = (rack) => {
        setSelectedAssessment(rack); // Set the clicked assessment details
    };

    // Handle filter selection (when user chooses boroname, condition, etc.)
    const handleFilterBySelect = (filter) => {
        setFilterBy(filter);
        setFilterValue(''); // Reset the filter value when filter type changes
    };

    // Handle filter value change and apply filter
    const handleFilterValueChange = (e) => {
        const value = e.target.value;
        setFilterValue(value);

        const filtered = bikeRacks.filter((rack) => {
            switch (filterBy) {
                case 'boroname':
                    return rack.boroname === value;
                case 'condition':
                    return rack.condition === value;
                case 'rackType':
                    return rack.rackType === value;
                default:
                    return true;
            }
        });

        setFilteredRacks(filtered);
    };

    const downloadAllData = () => {
        if (bikeRacks.length > 0) {
            const csvContent = [
                ['Site ID', 'User', 'Condition', 'Rack Type', 'Latitude', 'Longitude', 'Notes', 'New Position Latitude', 'New Position Longitude'],
                ...bikeRacks.map(rack => [
                    rack.site_ID,
                    rack.user,
                    rack.condition,
                    rack.rackType,
                    rack.latitude,
                    rack.longitude,
                    rack.assessment,
                    rack.newPosition?.latitude || 'N/A',
                    rack.newPosition?.longitude || 'N/A'
                ])
            ]
                .map(row => row.join(','))
                .join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'all_bike_rack_data.csv';
            link.click();
        }
    };

    const downloadAssessment = () => {
        if (selectedAssessment) {
            const csvContent = [
                ['Site ID', 'User', 'Condition', 'Rack Type', 'Latitude', 'Longitude', 'Notes', 'New Position Latitude', 'New Position Longitude'],
                [
                    selectedAssessment.site_ID,
                    selectedAssessment.user,
                    selectedAssessment.condition,
                    selectedAssessment.rackType,
                    selectedAssessment.latitude,
                    selectedAssessment.longitude,
                    selectedAssessment.assessment,
                    selectedAssessment.newPosition?.latitude || 'N/A',
                    selectedAssessment.newPosition?.longitude || 'N/A'
                ]
            ]
                .map(row => row.join(','))
                .join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `assessment_${selectedAssessment.site_ID}.csv`;
            link.click();
        }
    };

    return (
        <div className="data">
            <h1>Bike Rack Data</h1>
            <ButtonGroup aria-label="Basic example">
              <Button onClick={downloadAllData} variant="secondary">Download All</Button>
              <Dropdown as={ButtonGroup} onSelect={handleFilterBySelect}>
                  <Dropdown.Toggle variant="secondary" id="dropdown-basic">
                      Filter By
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                      <Dropdown.Item eventKey="boroname">Borough</Dropdown.Item>
                      <Dropdown.Item eventKey="condition">Condition</Dropdown.Item>
                      <Dropdown.Item eventKey="rackType">Rack Type</Dropdown.Item>
                      {/* <Dropdown.Item eventKey="user">User</Dropdown.Item> */}
                  </Dropdown.Menu>
              </Dropdown>
            </ButtonGroup>
            {/* Render filter input dropdown if a filter is selected */}
            {filterBy && (
                <Form.Group controlId="filterValue" style={{ marginTop: '10px' }}>
                    <Form.Label><b>Filter by</b></Form.Label>
                    <Form.Control as="select" value={filterValue} onChange={handleFilterValueChange}>
                        <option value="">All</option>
                        {filterBy === 'boroname' && (
                            <>
                                <option value="Bronx">Bronx</option>
                                <option value="Manhattan">Manhattan</option>
                                <option value="Brooklyn">Brooklyn</option>
                                <option value="Queens">Queens</option>
                                <option value="Staten Island">Staten Island</option>
                            </>
                        )}
                        {filterBy === 'condition' && (
                            <>
                                <option value="Missing">Missing</option>
                                <option value="Good">Good</option>
                                <option value="Damaged">Damaged</option>
                            </>
                        )}
                        {filterBy === 'rackType' && (
                            <>
                                <option value="Large Hoop">Large Hoop</option>
                                <option value="Small Hoop">Small Hoop</option>
                                <option value="Wall-Mounted">Wall-Mounted</option>
                            </>
                        )}
                    </Form.Control>
                </Form.Group>
            )}
            <p></p>
            <Table responsive striped bordered hover size="sm">
                <thead>
                    <tr>
                        <th>Bike Rack ID</th>
                        <th>Number of Assessments</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredRacks.length > 0 ? (
                        Object.keys(rackCounts).map((site_ID) => (
                            <React.Fragment key={site_ID}>
                                <tr>
                                    <td>{site_ID}</td>
                                    <td
                                        style={{ cursor: 'pointer', color: 'blue' }}
                                        onClick={() => toggleExpand(site_ID)}
                                    >
                                        {rackCounts[site_ID]}
                                    </td>
                                </tr>
                                {expandedRack === site_ID && (
                                    <tr>
                                        <td colSpan="2">
                                            <ul>
                                                {filteredRacks
                                                    .filter((rack) => rack.site_ID === site_ID)
                                                    .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date descending
                                                    .map((rack, index) => (
                                                        <li
                                                            key={index}
                                                            style={{ cursor: 'pointer', color: 'blue' }}
                                                            onClick={() => handleDateClick(rack)} // Click to show details
                                                        >
                                                            {rack.date ? `${new Date(rack.date).toLocaleDateString()} - ${new Date(rack.date).toLocaleTimeString()}` : 'N/A'}
                                                        </li>
                                                    ))}
                                            </ul>
                                        </td>
                                    </tr>
                                )}

                                {/* Render assessment details when a date is clicked */}
                                {selectedAssessment && expandedRack === site_ID && selectedAssessment.site_ID === site_ID && (
                                    <tr>
                                        <td colSpan="2">
                                            <Table bordered>
                                                <thead>
                                                    <tr>
                                                        <th>Site ID</th>
                                                        <th>User</th>
                                                        <th>Condition</th>
                                                        <th>Rack Type</th>
                                                        <th>Latitude</th>
                                                        <th>Longitude</th>
                                                        <th>Notes</th>
                                                        <th>New Position Latitude</th>
                                                        <th>New Position Longitude</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>{selectedAssessment.site_ID || 'N/A'}</td>
                                                        <td>{selectedAssessment.user || 'N/A'}</td>
                                                        <td>{selectedAssessment.condition || 'N/A'}</td>
                                                        <td>{selectedAssessment.rackType || 'N/A'}</td>
                                                        <td>{selectedAssessment.latitude}</td>
                                                        <td>{selectedAssessment.longitude}</td>
                                                        <td>{selectedAssessment.assessment || 'N/A'}</td>
                                                        <td>{selectedAssessment.newPosition?.latitude || 'N/A'}</td>
                                                        <td>{selectedAssessment.newPosition?.longitude || 'N/A'}</td>
                                                    </tr>
                                                </tbody>
                                            </Table>
                                            <Button onClick={downloadAssessment}>Download File</Button>&nbsp;
                                            <Button disabled>Download Image</Button>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="2">No data available</td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
}

export default Data;
