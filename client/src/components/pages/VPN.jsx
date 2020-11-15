import React, { useState, useEffect } from "react";
import api from "../../api";
import { Button, Form, FormGroup, Label } from "reactstrap";
import Select from "react-select";

const VPN = ({updateGlobalValues}) => {
  const [vpnState, setVpnState] = useState({
    cities: null,
    massagedCities: null,
    cityPrice: null,
    selectedOption: null,
    loading: true,
  });

  useEffect(() => {
   const fetchCities = async() =>{
     const data = await api.getCities()
     const massagedCities = dataMassager(data.cities);
     setVpnState({
        ...vpnState,
        cities: data.cities,
        massagedCities: massagedCities,
        loading: false,
      });
   }
   fetchCities()
  }, []);
  // todo. add price in here somewhere
  const handleChange = (selectedOption) => {
    setVpnState({ ...vpnState, selectedOption });
    console.log(vpnState,'vpnState',selectedOption,'selected')
  };

  const handleTravel = async () => {
    const cityId = vpnState.selectedOption.value;
    const result = await api.changeCity({ cityId })
    updateGlobalValues(result)
  };

  const dataMassager = (cityArray) => {
    const massagedCities = [];
    cityArray.forEach((c) => {
      massagedCities.push({
        value: c._id,
        label: c.name,
        price: c.price,
      });
    });

    return massagedCities;
  };

  const priceOverview = (
    vpnState.selectedOption && (
    <div>
      <h6> <span style={{ color: "#F08F18" }}>&#8383;</span> {vpnState.selectedOption.price.toLocaleString()}</h6>
      <h6> <span>&#9889;5%</span> </h6>
    </div>
    )
  )

  return (
    <div className="page-container">
      <h2>VPN</h2>

      <Form style={{ width: "25%" }} className="content">
        <FormGroup>
          <Select
            className={"text-dark mb-3"}
            value={vpnState.selectedOption}
            onChange={handleChange}
            options={vpnState.loading ? "" : vpnState.massagedCities}
          />
           {priceOverview} 
        </FormGroup>
        <Button onClick={() => handleTravel()}>Change VPN</Button>
      </Form>
    </div>
  );
};

export default VPN;
